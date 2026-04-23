import {Link} from "react-router-dom";
import {RouterProvider} from "react-router-dom";
import HomeScreen from "./HomeScreen";

function checkInfo(){
			let userName = "", password = "", valid = false;
			let userInfo = {};
			const loginText = document.getElementById("usernameValidText");
			
			userName = document.getElementById("usernameTextBox").value;
			password = document.getElementById("passwordTextBox").value;
			
			if(userName == "war" && password == "Bruh"){
				loginText.style.color = "#00ff00";
				loginText.textContent = "login succesful";
				valid = true;
			}else{
				loginText.style.color = "#ff0000";
				loginText.textContent = "invalid username or password";
				valid = false;
			}
			
			HomeScreen("hi");
			if(valid){
				
				
			}
}



function createProfileScreen(){
	
	
}

function LoginScreen(){
	return( <>
	
	<div className="mainBackground">

	<div className="container">
		
		<div className="welcomeMessage">
			<h1> Please Log In </h1>
		</div>
		<div className="userInfo">
			<p>UserName </p>
			<p id="usernameValidText"></p>
			<input id="usernameTextBox"/>
			<p>Password </p>
			<p id="passwordVaildText"></p>
			<input type="password" id="passwordTextBox"/>
		</div>
		<div>
			<Link to="/"><button>cancel</button></Link>
			<button onClick={checkInfo}>login</button>
		</div>
	</div>
	
	</div>
	
	</>);
}

export default LoginScreen;