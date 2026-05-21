import {Link} from 'react-router-dom';

function AboutScreen(){

return(

	<div className="about-screen">
			<h1 className="text-title"> About Pickup </h1>



        <div className='center-content'>
            <div className='bubble'>


                <div className='text-question'>
                    <p>
                        Looking for an easy way to schedule matches that are suited for you?
                    </p>

                </div>
                <div className='text-info'>
                <p>
                    Pickup application to create spontaneous sports games
                    (basketball, tennis, etc) at both competitive and casual levels. The application is
                    designed to require fewer steps and be more suited to the player's skill level and
                    schedule as compared to existing methods for creating games (forums, gym groups)
                </p>

                </div>
            </div>

        </div>  
        </div>);
}

export default AboutScreen;