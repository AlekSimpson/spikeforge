package main

import (
    "log"
    "net/http"
    "sync"
    "github.com/gorilla/websocket"
)

type MessageType int
const (
    START MessageType  = iota
    STOP
    RESET
    UPDATE // sim update
    SET
)

type Message struct {
    Type_ MessageType `json:"type"`
    Payload interface{} `json:"payload"`
}

type Bridge struct {
    // Frontend connections
    frontend_conn *websocket.Conn
    frontend_mu   sync.RWMutex
    
    // Python engine connection
    python_conn *websocket.Conn
    python_mu   sync.RWMutex
    
    upgrader websocket.Upgrader
}

func new_bridge() *Bridge {
    return &Bridge{
        upgrader: websocket.Upgrader{
            CheckOrigin: func(r *http.Request) bool { return true },
        },
    }
}

// Handle frontend WebSocket connections
func (b *Bridge) handle_frontend_ws(w http.ResponseWriter, r *http.Request) {
    conn, err := b.upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Println("Frontend upgrade error:", err)
        return
    }
    
    client_id := generate_id()
    
    b.frontend_mu.Lock()
    b.frontend_conn = conn
    b.frontend_mu.Unlock()
    
    log.Printf("Frontend client %s connected", client_id)
    
    defer func() {
        b.frontend_conn.Lock()
        b.frontend_conn = nil
        b.frontend_conn.Unlock()
        conn.Close()
        log.Printf("Frontend client %s disconnected", client_id)
    }()
    
    // Read from frontend, send to Python
    for {
        var msg map[string]interface{}
        err := conn.ReadJSON(&msg)
        if err != nil {
            log.Println("Frontend read error:", err)
            break
        }
        
    }
}

// Handle Python engine WebSocket connection
func (b *Bridge) handle_python_ws(w http.ResponseWriter, r *http.Request) {
    conn, err := b.upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Println("Python upgrade error:", err)
        return
    }
    
    b.python_mu.Lock()
    b.python_conn = conn
    b.python_mu.Unlock()
    
    log.Println("Python engine connected")
    
    defer func() {
        b.python_mu.Lock()
        b.python_conn = nil
        b.python_mu.Unlock()
        conn.Close()
        log.Println("Python engine disconnected")
    }()
    
    // Read from Python, broadcast to frontend
    for {
        var msg map[string]interface{}
        err := conn.ReadJSON(&msg)
        if err != nil {
            log.Println("Python read error:", err)
            break
        }
        
        b.send_to_frontend(msg)
    }
}

func (b *Bridge) send_to_engine(data interface{}) {
    b.python_mu.RLock()
    defer b.python_mu.RUnlock()

    if b.python_conn == nil {
        log.Println("Engine not connected")
        return
    }
    
    if err := b.python_conn.WriteJSON(data); err != nil {
        log.Printf("Error sending to engine %s: %v", client_id, err)
    }
}

func (b *Bridge) send_to_frontend(data interface{}) {
    b.frontend_mu.RLock()
    defer b.frontend_mu.RUnlock()

    if b.frontend_conn == nil {
        log.Println("Frontend not connected")
        return
    }
    
    if err := b.frontend_conn.WriteJSON(data); err != nil {
        log.Printf("Error sending to frontend %s: %v", client_id, err)
    }
}

func (b *Bridge) handle_set_engine(w http.ResponseWriter, r *http.Request) {
}

func (b *Bridge) handle_engine_stop(w http.ResponseWriter, r *http.Request) {
}

func (b *Bridge) handle_engine_start(w http.ResponseWriter, r *http.Request) {
}

func (b *Bridge) handle_engine_reset(w http.ResponseWriter, r *http.Request) {
}

func main() {
    server := new_bridge()
    
    http.HandleFunc("/ws/frontend", server.handle_frontend_ws)
    http.HandleFunc("/ws/python", server.handle_python_ws)

    http.HandleFunc("/set_engine", server.handle_set_engine)
    http.HandleFunc("/stop_engine", server.handle_engine_stop)
    http.HandleFunc("/start_engine", server.handle_engine_start)
    http.HandleFunc("/reset_engine", server.handle_engine_reset)
    
    log.Println("Bridge server starting on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}

func generate_id() string {
    return fmt.Sprintf("%d", time.Now().UnixNano())
}
