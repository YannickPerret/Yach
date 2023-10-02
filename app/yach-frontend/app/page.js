'use client'
import React, { useEffect, useState } from 'react';
import '../styles/index.css'

export default function Home() {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      username: username,
      password: password
    }

    await fetch('http://localhost:3000/api/v1/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
    })
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('username', data.username);
          window.location.href = `/users/${data.username}/dashboard`;
        }
      })
      .catch(err => console.log(err));
  }


  useEffect(() => {
    if (localStorage.getItem('token') && localStorage.getItem('username')) {
      window.location.href = `/users/${localStorage.getItem('username')}/dashboard`;
    }
  }, [])


  return (
    <main className="container">
      <div className="screen">
        <div className="screen__content" >
          <form className="login" id="form-login" onSubmit={(e) => handleSubmit(e)}>
            <div className="login__field">
              <i className="login__icon fas fa-user"></i>
              <input type="text" className="login__input" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="login__field">
              <i className="login__icon fas fa-lock"></i>
              <input type="password" className="login__input" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button className="button login__submit">
              <span className="button__text">Log In Now</span>
              <i className="button__icon fas fa-chevron-right"></i>
            </button>
          </form>
          <div className="social-login">
            <h3>log in via</h3>
            <div className="social-icons">
              <a href="#" className="social-login__icon fab fa-instagram"></a>
              <a href="#" className="social-login__icon fab fa-facebook"></a>
              <a href="#" className="social-login__icon fab fa-twitter"></a>
            </div>
          </div>
        </div>
        <div className="screen__background">
          <span className="screen__background__shape screen__background__shape4"></span>
          <span className="screen__background__shape screen__background__shape3"></span>
          <span className="screen__background__shape screen__background__shape2"></span>
          <span className="screen__background__shape screen__background__shape1"></span>
        </div>
      </div>
    </main>
  )
}
