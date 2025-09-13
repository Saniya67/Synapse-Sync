import React from 'react';
import { Button, ListGroup } from 'react-bootstrap';
import { FaTrash } from 'react-icons/fa';

function Sidebar({ chats, selectChat, newChat, deleteChat, goBack }) {
  return (
    <div className="sidebar">
      <Button className="back-btn mb-2" variant="secondary" onClick={goBack}>
        ← Back
      </Button>
      <Button className="new-chat-btn mb-2" onClick={newChat}>
        + New Evidence Request
      </Button>
      <ListGroup className="chat-list">
        {chats.map((chat, idx) => (
          <ListGroup.Item key={idx} className="chat-item">
            <span
              style={{ cursor: 'pointer' }}
              onClick={() => selectChat(idx)}
            >
              {chat.name}
            </span>
            <FaTrash
              style={{ float: 'right', cursor: 'pointer', color: '#ff4d4d' }}
              onClick={() => deleteChat(idx)}
            />
          </ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  );
}

export default Sidebar;
