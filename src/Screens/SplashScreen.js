import {Link} from 'react-router-dom';


function createSplashScreen(){

return(<>
					
	<div className="textBackground">
		<p className="depth" title="Pickup">Pickup</p>
	</div>
				
	<div>
		<button>Create Profile</button>
		<Link to="/LoginScreen"><button>Login</button></Link>
				
	</div>
	
	
	</>);
}

export default createSplashScreen;