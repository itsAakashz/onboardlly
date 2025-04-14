export const validateEmployeeSession = () => {
    if (typeof window === "undefined") return false;
    
    const session = JSON.parse(sessionStorage.getItem("employeeSession"));
    if (!session) return false;
  
    // Session expires after 1 hour
    const isExpired = (new Date().getTime() - session.timestamp) > 3600000;
    return !isExpired && session.loggedIn;
  };
  
  export const clearEmployeeSession = () => {
    sessionStorage.removeItem("employeeSession");
  };