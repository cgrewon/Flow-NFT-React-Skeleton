import "./config";
import "./App.css";
import { useState, useEffect } from "react";
import AuthedState from "./components/AuthedState";
import * as fcl from "@onflow/fcl";



function App() {
  const [user, setUser] = useState({ loggedIn: null });
  

  useEffect(() => fcl.currentUser.subscribe(setUser), []);

  const UnauthenticatedState = () => {
    return (
      <div>
        <button onClick={fcl.logIn}>Log In</button>
        <button onClick={fcl.signUp}>Sign Up</button>
      </div>
    );
  };
    

  return (
    <div className="App">
      <header className="App-header">
        {user.loggedIn ? <AuthedState user={user}/> : <UnauthenticatedState />}
      
      </header>
    </div>
  );
}

export default App;
