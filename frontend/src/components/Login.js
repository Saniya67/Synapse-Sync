import React, { useState } from 'react';
import { Button, Form } from 'react-bootstrap';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Basic demo login
    if (username && password) {
      onLogin(username);
    } else {
      alert('Enter username and password');
    }
  };

  return (
    <div className="login-container">
      <h2>Evidence-on-Demand Bot Login</h2>
      <Form onSubmit={handleSubmit} className="login-form">
        <Form.Control
          type="email"
          placeholder="username@gmail.com"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mb-2"
          required
        />
        <Form.Control
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-2"
          maxLength={5}
          required
        />
        <Button type="submit" className="login-btn">Login</Button>
      </Form>
    </div>
  );
}

export default Login;
