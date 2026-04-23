import {Link} from 'react-router-dom';

function SplashScreen(){

return(<>

	<div className="textBackground">
		<p className="depth" title="Pickup">Pickup</p>
	</div>

	<div>
		<Link to="/ProfileCreationScreen"><button>Create Profile</button></Link>
		<Link to="/LoginScreen"><button>Login</button></Link>

	</div>


	</>);
}

export default SplashScreen;