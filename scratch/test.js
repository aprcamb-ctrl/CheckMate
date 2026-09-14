const jobs = [
  { status: 'COMPLETED', title: 'Monthly HVAC Maintenance' },
  { status: 'PENDING', title: 'Fix AC' }
];

let unassignedJobs = jobs;
unassignedJobs = unassignedJobs.filter(j => j.status !== 'COMPLETED');
console.log(unassignedJobs);
