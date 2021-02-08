import React from 'react';
import EncryptedStorage from 'react-native-encrypted-storage';
import EventCoordinator from './EventCoordinator';
import AcquireConfigScreen from "../screens/AcquireConfigScreen"

const globalAny:any = global

export function withSecureConfig(WrappedComponent:any) {
    return class extends React.Component {
      state = {
        isConfigAquired: false,
        userData :null,
        errorMessage:null
      };

      constructor(props:any) {
        super(props);
       
        EncryptedStorage.getItem("pk-mobile-config").then(value => {
          globalAny.config = value;
          this.setState({isConfigAquired: true});
        }).catch(err => {
          console.log("error retreiving pk-mobile-config " + err.message);
        });

        EventCoordinator.register('auth', ({ payload }) => {
          const { type } = payload;
          switch (type) {
            case 'signIn':
              this.setState({isSignedIn: true, errorMessage:null, userData:null});
              AsyncStorage.setItem('@user-signed-in-to-app', 'true');
              break;
            case 'newPassword':
              this.setState({userData: payload.data});
              break;
            case 'signOut':
              this.setState({isSignedIn: false});
              if(payload.errorMessage) {
                this.setState({errorMessage: payload.errorMessage});
              }
              AsyncStorage.removeItem('@user-signed-in-to-app');
              break;
          }
        });

      }
  
      componentDidMount() {
        // ... that takes care of the subscription...
        //DataSource.addChangeListener(this.handleChange);
      }
  
      componentWillUnmount() {
        //DataSource.removeChangeListener(this.handleChange);
      }
  
       onLogin = async (email:string, pwd:string) => {
          //console.log("[CognitoAuthentication] onLogin using authSystem:"+authSystem);
          if(authSystem === "cognito") {
            return new Promise(function(resolve, reject) {
                Auth.signIn(email, pwd)
                .then(user => {
                  if(user.challengeName === 'NEW_PASSWORD_REQUIRED'){
                    EventCoordinator.signal('auth', {type:'newPassword', data:{user:user, email:email}, message:'Need new password'});
                  } else {
                    EventCoordinator.signal('auth', {type:'signIn', data:user, message:'Successfull Cognito user sign in'});
                  }
                  resolve(user);
                })
                .catch(error => {
                  console.log("[CognitoAuthentication] Auth.signIn Error : " + error.message);
                  reject(error);
                });
            });
          } else {
            throw Error("Unsupported authentication system.");
          }
      }
  
      onNewPassword =  (user:any, email:string, pwd:string) => {
        //console.log("[CognitoAuthentication] onLogin using authSystem:"+authSystem);
        if(authSystem === "cognito") {
          return new Promise(function(resolve, reject) {
            Auth.completeNewPassword(
              user,               // the Cognito User Object
              pwd,       // the new password
              {
                email,
              }
            ).then(signedInUser => {
                EventCoordinator.signal('auth', {type:'signIn', data:signedInUser, message:'Successfull Cognito user sign in'});
                resolve(user);
              })
              .catch(error => {
                console.log("[CognitoAuthentication] Auth.signIn Error : " + error.message);
                reject(error);
              });
          });
        } else {
          throw Error("Unsupported authentication system.");
        }
    }
    render() {
      if(this.state.isConfigAquired)
        return <WrappedComponent {...this.props} />
      else 
        return <LoginScreen errorMessage={this.state.errorMessage} onLogin={this.onLogin.bind(this)}/>
      }
    };
}