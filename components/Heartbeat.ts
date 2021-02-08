import * as React from 'react';
import axios from "axios"

const globalAny:any = global

// export async function startHeartbeat() {
//     globalAny.heartbeatInterval = setInterval(() => {
//         //console.log('Heartbeat');
//         heartbeat('online');
//       }, 300000);
// }

// export async function stopHeartbeat() {
//     if(globalAny.heartbeatInterval) {
//         heartbeat('offline');
//         clearInterval(globalAny.heartbeatInterval);
//         globalAny.heartbeatInterval = null;
//     }
// }

// export async function pauseHeartbeat() {
//   if(globalAny.heartbeatInterval) {
//       clearInterval(globalAny.heartbeatInterval);
//       globalAny.heartbeatInterval = null;
//   }
// }

export function heartbeat(status : string = '') {
  if(globalAny.user) {
    if(status && status.length > 0)
      globalAny.userStatus = status;

    if(globalAny.userStatus && globalAny.userStatus.length > 0) {
      //console.log("heartbeat:"+ status);
      axios.put("/projetkhiron/heartbeat", {
        userId: globalAny.user._id, status: globalAny.userStatus, date : new Date(), statusDevice:'mobile',
      }) 
      .then((response) => {
        //console.log(response);
      }, (error) => {
        console.log("Failed hearbeat." + error.message);
      });
    }
  }
}

