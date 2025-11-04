
    import React, {Component} from 'react';
    import architecture from '../../assets/3TierArch.png'

    class Home extends Component {
        render () {
        return (
            <div>
            <h1 style={{color:"white"}}>'Aquainfra'</h1>
            <img src={architecture} alt="Aquainfra" style={{height:400,width:825}} />
          </div>
        );
      }
    }

    export default Home;
