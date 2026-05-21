import {Link} from 'react-router-dom';
import image from './image.png';

function SplashScreen(){

return(

	<div className="start-screen">
	<div className="circle-container">
		<svg viewBox='0 0 100 100'>
			<defs>
				<path id="circle" d=" 
				M 50, 50
				m -37, 0
				a 37, 37 0 1,1 74,0
				a 37,37 0 1,1 -74,0" >
					</path>	
			</defs>
			<g className='rotation'>
			<text className='curved-text'>
				<textPath href="#circle">

					<tspan fontSize="12">Pickup</tspan>
					<tspan dx="35" fontSize="5">• Match • </tspan>
					<tspan fontSize="5">Play • </tspan>
					<tspan fontSize="5">Repeat •  </tspan>

				</textPath>
			</text>
			</g>
		</svg >

		<div className="image-container">
			<img src={image} alt="Center Image" />
		</div>

		<div className='start-button'>
		<div className='btn'>
		<Link to="/ProfileCreationScreen"><button>Create Profile</button></Link>
		<Link to="/LoginScreen"><button>Login</button></Link>
		</div>		
	</div>
	</div>
	
	
	</div>);
}

export default SplashScreen;