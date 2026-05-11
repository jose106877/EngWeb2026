const PACKAGE_TYPES = 
{
  SIP: "SIP",
  AIP: "AIP",
  DIP: "DIP",
};

function isMutation(req) 
{
  return ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
}


function attachTransportSecurityContext(req, res, next) 
{
  const incomingPackage = isMutation(req)
    ? PACKAGE_TYPES.SIP
    : PACKAGE_TYPES.DIP;
  const outgoingPackage = isMutation(req)
    ? PACKAGE_TYPES.AIP
    : PACKAGE_TYPES.DIP;

  req.securityContext = 
  {
    authenticated: Boolean(req.user),
    incomingPackage,
    outgoingPackage,
  };

  res.setHeader("X-AEEUM-Incoming-Package", incomingPackage);
  res.setHeader("X-AEEUM-Outgoing-Package", outgoingPackage);
  return next();
}

module.exports = 
{
  PACKAGE_TYPES,
  attachTransportSecurityContext,
};