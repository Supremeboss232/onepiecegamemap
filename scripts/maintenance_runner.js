import { spawnSync } from 'child_process';

console.log('Running maintenance: release-inactive, check-congestion, faction-aggression');

function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: false });
  if (res.status !== 0) {
    console.error(`Command ${cmd} ${args.join(' ')} failed with code ${res.status}`);
  }
}

run('node', ['scripts/release_inactive.js']);
run('node', ['scripts/check_congestion.js']);
run('node', ['scripts/faction_aggression.js']);
