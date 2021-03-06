const DEBUG = false;
const _ = require("lodash");

class MemoryStore {
   constructor() {
      this.temp = {};
      this.cleaner = {};
   }

   get getUsers() {
      return Object.keys(this).filter((elem) => {
         return !(elem === "temp" || elem === "cleaner");
      });
   }

   get getCleaners() {
      return Object.keys(this.cleaner);
   }

   garbageCollector() {
      console.log("start collecting");
      setInterval(() => {
         const sessions = this.getUsers;
         const cleaners = this.getCleaners;
         DEBUG && console.log("looking for garbage");
         DEBUG && console.log(sessions);
         
         sessions.forEach((elem) => {
            DEBUG && console.log(this[elem]);
            !this[elem].isActive && delete this[elem];
         });
         DEBUG && console.log(this);
      }, 60 * 60 * 1000);
   }

   set setMaxAge(refId) {
      const cleanerObj = { inid: null };
      cleanerObj.maxAge = function(memoryStore) {
         DEBUG && console.log("set to clean");
         return setTimeout(() => {
            let histories, currefId = refId;

            _.forIn(memoryStore, function(val, key) {
               if (_.has(val.history, refId)) {
                  currefId = key;
                  histories = val.history;
               };
            });

            DEBUG && console.log("cleaning");
            delete memoryStore[currefId];
            _.forIn(histories, function(val, key) {
               clearTimeout(memoryStore.cleaner[key].inid);
               delete memoryStore.cleaner[key];
            });
            DEBUG && console.log(memoryStore);
         }, 12 * 60 * 60 * 1000); // the user info will only live maximum of 12 hours in memory
      };

      this.cleaner[refId] = cleanerObj;
      this.cleaner[refId].inid = this.cleaner[refId].maxAge(this);
   }

   // user session contains state and timeout, upon first time the user 
   // authenticate themselves first time out (as maxAge) is triggered and will cleared up 
   // user session after 12 hours
   // the second is triggered after user token expired
   // if after 30 min the session did not reactivate with new auth
   // a variable flaaging active state is set to false
   // session set to false will not be inherit by future reactivation
   // the memoryStore will perform a 1 hour interval clear up action to free up memmory space
   set setUserSession(params) {
      const { username, _id, history, refId } = params;
      const userObj = { username, _id, history, isActive: true };
      userObj.setState = function() {
         setTimeout(() => {
            this.isActive = false;
         }, 60 * 60 * 1000); // once set to false history will not be inheritted by new session
      }; // doesn't need to toggle since with new auth the prop is destroyed and recreated

      this[refId] = userObj;
      this[refId].setState();
      this.setMaxAge = refId;
   }

   set setTemp(params) {
      const { temp } = this;
      const [tempObj, refId] = params;

      tempObj.timeout = function(memoryStore) {
         DEBUG && console.log("timeout set");
         setTimeout(() => {
            delete memoryStore.temp[refId];
         }, 30 * 60 * 1000); // 30 min timeout
      };

      this.temp[refId] = tempObj;
      this.temp[refId].timeout(this);
   }
}

module.exports = new MemoryStore();