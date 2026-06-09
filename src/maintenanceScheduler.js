import { spawn } from 'child_process';

// Maintenance Scheduler
// Orchestrates periodic execution of game safeguard rules

export class MaintenanceScheduler {
  constructor() {
    this.isRunning = false;
    this.schedules = {
      inactivityRelease: { interval: 24 * 60 * 60 * 1000, lastRun: null }, // Daily
      congestionCheck: { interval: 2 * 60 * 60 * 1000, lastRun: null }, // Every 2 hours
      factionAggression: { interval: 30 * 60 * 1000, lastRun: null } // Every 30 minutes
    };
  }

  // Start maintenance scheduler
  start() {
    if (this.isRunning) {
      console.log('Maintenance scheduler already running');
      return;
    }

    this.isRunning = true;
    console.log('Maintenance scheduler started');

    // Run initial checks
    this.checkAndRun();

    // Set up interval checks
    setInterval(() => this.checkAndRun(), 60 * 1000); // Check every minute
  }

  // Stop maintenance scheduler
  stop() {
    this.isRunning = false;
    console.log('Maintenance scheduler stopped');
  }

  // Check if any maintenance tasks should run
  async checkAndRun() {
    const now = Date.now();

    // Check inactivity release
    if (!this.schedules.inactivityRelease.lastRun || 
        now - this.schedules.inactivityRelease.lastRun >= this.schedules.inactivityRelease.interval) {
      await this.runInactivityRelease();
      this.schedules.inactivityRelease.lastRun = now;
    }

    // Check congestion
    if (!this.schedules.congestionCheck.lastRun || 
        now - this.schedules.congestionCheck.lastRun >= this.schedules.congestionCheck.interval) {
      await this.runCongestionCheck();
      this.schedules.congestionCheck.lastRun = now;
    }

    // Check faction aggression
    if (!this.schedules.factionAggression.lastRun || 
        now - this.schedules.factionAggression.lastRun >= this.schedules.factionAggression.interval) {
      await this.runFactionAggression();
      this.schedules.factionAggression.lastRun = now;
    }
  }

  // Run inactivity release script
  async runInactivityRelease() {
    return this.executeScript('scripts/release_inactive.js', 'Inactivity Release');
  }

  // Run congestion check script
  async runCongestionCheck() {
    return this.executeScript('scripts/check_congestion.js', 'Congestion Check');
  }

  // Run faction aggression script
  async runFactionAggression() {
    return this.executeScript('scripts/faction_aggression.js', 'Faction Aggression');
  }

  // Execute a script and return promise
  executeScript(scriptPath, scriptName) {
    return new Promise((resolve, reject) => {
      console.log(`[${new Date().toISOString()}] Running ${scriptName}...`);

      const child = spawn('node', [scriptPath], {
        stdio: 'pipe',
        shell: false
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log(`[${new Date().toISOString()}] ✓ ${scriptName} completed`);
          console.log(output);
          resolve({ success: true, output });
        } else {
          console.error(`[${new Date().toISOString()}] ✗ ${scriptName} failed with code ${code}`);
          console.error(errorOutput);
          reject(new Error(`${scriptName} failed: ${errorOutput}`));
        }
      });

      child.on('error', (err) => {
        console.error(`[${new Date().toISOString()}] ✗ ${scriptName} error:`, err);
        reject(err);
      });
    });
  }

  // Get status
  getStatus() {
    return {
      isRunning: this.isRunning,
      schedules: Object.entries(this.schedules).reduce((acc, [key, val]) => {
        acc[key] = {
          lastRun: val.lastRun ? new Date(val.lastRun).toISOString() : 'Never',
          nextRun: val.lastRun ? new Date(val.lastRun + val.interval).toISOString() : 'ASAP'
        };
        return acc;
      }, {})
    };
  }
}
