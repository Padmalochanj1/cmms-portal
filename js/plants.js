// Plants and sections shown on the sign-in page. soon:true shows a section greyed out as "coming soon".
// hodLogin:true keeps a coming-soon section selectable at sign-in, for HOD users only (HOD is a user type of Operation).
// To open a section later: remove soon:true here, and add the matching line in worker.js (UNITS).
window.CMMS_PLANTS = [
  { id: "coal-washery", name: "Coal Washery", sections: [{ id: "ei", name: "E&I" }, { id: "mech", name: "Mechanical" }, { id: "ops", name: "Operation", soon: true, hodLogin: true }] },
  { id: "coke-oven", name: "Coke Oven", sections: [{ id: "ei", name: "E&I" }, { id: "mech", name: "Mechanical" }, { id: "ops", name: "Operation" }] },
  { id: "rmhs", name: "RMHS", sections: [{ id: "ei", name: "E&I" }] }
];
