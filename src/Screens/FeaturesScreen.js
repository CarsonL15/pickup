import {Link} from 'react-router-dom';

function FeaturesScreen(){

return(

    <div className='about-screen'>

        <h1 className="text-title"> Features </h1>
	  <div className='bubble-container'>
            <div className='bubble-feature'>

                <div className='text-feature'>
                    <p>
                        Matching algorithm:
                    </p>
                </div>

                    <div classname="text-featureInfo">
                        <p>
                        Matching players based on rating, type, and location to create the best game!                     </p>
                    </div>

        

            </div>


                <div className='bubble-feature'>

                     <div className='text-feature'>
                        <p>
                            Competitve vs Casual:
                        </p>

                    </div>
                    <div classname="text-featureInfo">
                        <p>
                        Can schedule two different types of games!</p>
                    </div>

            </div>

              

            <div className='bubble-feature'>

                <div className='text-feature'>
                    <p>
                        Make new friends:
                    </p>

                </div>

                <div classname="text-featureInfo">
                        <p>
                        Build a new community!
                        </p>
                    </div>

            </div>


            <div className='bubble-feature'>

                <div className='text-feature'>
                    <p>
                        Keep track of games!
                    </p>
                </div>

                <div classname="text-featureInfo">
                        <p>
                        Record your wins and losses and see how you improve over time!
                        </p>
                    </div>

            </div>

        </div>   

        </div>
        );
}

export default FeaturesScreen;