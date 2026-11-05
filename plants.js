// Plants and sections shown on the sign-in page. soon:true shows a section greyed out as "coming soon".
// To open a section later: remove soon:true here, and add the matching line in worker.js (UNITS).
window.CMMS_PLANTS = [
  { id: "coal-washery", name: "Coal Washery", sections: [{ id: "ei", name: "E&I" }, { id: "ops", name: "Operation", soon: true }] },
  { id: "coke-oven", name: "Coke Oven", sections: [{ id: "ei", name: "E&I" }, { id: "ops", name: "Operation", soon: true }] }
];
