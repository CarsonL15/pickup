import { Link } from 'react-scroll';


function Navigation(){
  return (
  <nav className="nav-bar">
    <Link to="start" smooth={true} duration={500}>Welcome</Link>
    <Link to="about" smooth={true} duration={500}>About Pickup</Link>
    <Link to="features" smooth={true} duration={500}>Features</Link>

  </nav>
);

}
export default Navigation;
