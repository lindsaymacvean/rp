function DyslexiaService () {
    this.IsLeadFacilitator = async(userAttributes) => {
        try{
            return userAttributes["cognito:groups"].includes("LeadFacilitators");
        }
        catch (e){
            return false;
        }
       
    };
}

module.exports = DyslexiaService;