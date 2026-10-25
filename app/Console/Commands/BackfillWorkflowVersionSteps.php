<?php

namespace App\Console\Commands;

use App\Models\WorkflowVersion;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class BackfillWorkflowVersionSteps extends Command
{
    protected $signature = 'workflows:backfill-version-steps
                            {--dry-run : Preview changes without inserting records}';

    protected $description = 'Backfill immutable steps from saved workflow version definitions';

    public function handle(): int
    {
        $versions = WorkflowVersion::query()
            ->where('status', 'published')
            ->withCount('steps')
            ->orderBy('id')
            ->get();

        $created = 0;
        $skipped = 0;
        $failed = 0;
        $dryRun = (bool) $this->option('dry-run');

        foreach ($versions as $version) {
            if ($version->steps_count > 0) {
                $this->line(
                    "Skipped version {$version->id}: immutable steps already exist."
                );

                $skipped++;

                continue;
            }

            $definition = $version->definition;
            $definitionSteps = $definition['steps'] ?? null;

            if (! is_array($definitionSteps) || count($definitionSteps) === 0) {
                $this->warn(
                    "Skipped version {$version->id}: no saved steps in its definition."
                );

                $skipped++;

                continue;
            }

            if ($dryRun) {
                $this->info(
                    "Would backfill version {$version->id} with "
                    . count($definitionSteps)
                    . ' step(s).'
                );

                $created += count($definitionSteps);

                continue;
            }

            try {
                $inserted = DB::transaction(function () use (
                    $version,
                    $definitionSteps
                ) {
                    /*
                     * Lock and recheck the version so an overlapping command
                     * cannot blindly duplicate its immutable steps.
                     */
                    $lockedVersion = WorkflowVersion::query()
                        ->whereKey($version->id)
                        ->lockForUpdate()
                        ->firstOrFail();

                    if ($lockedVersion->steps()->exists()) {
                        return 0;
                    }

                    $inserted = 0;

                    foreach ($definitionSteps as $step) {
                        if (! is_array($step)) {
                            throw new \RuntimeException(
                                "Invalid step definition in version {$version->id}."
                            );
                        }

                        $name = $step['name'] ?? null;
                        $position = $step['position'] ?? null;

                        if (
                            ! is_string($name)
                            || trim($name) === ''
                            || ! is_numeric($position)
                            || (int) $position < 1
                        ) {
                            throw new \RuntimeException(
                                "Missing or invalid step name/position in version {$version->id}."
                            );
                        }

                        $lockedVersion->steps()->create([
                            'original_step_id' => $step['id'] ?? null,
                            'name' => $name,
                            'step_type' => $step['step_type'] ?? 'approval',
                            'position' => (int) $position,
                            'office_id' => $step['office']['id'] ?? null,
                            'approver_id' => $step['approver']['id'] ?? null,
                            'settings' => $step['settings'] ?? null,
                        ]);

                        $inserted++;
                    }

                    return $inserted;
                });

                $created += $inserted;

                $this->info(
                    "Version {$version->id}: inserted {$inserted} immutable step(s)."
                );
            } catch (Throwable $exception) {
                $failed++;

                Log::error('Workflow version step backfill failed.', [
                    'workflow_version_id' => $version->id,
                    'error' => $exception->getMessage(),
                ]);

                $this->error(
                    "Version {$version->id} failed: {$exception->getMessage()}"
                );
            }
        }

        $this->newLine();

        $this->table(
            ['Result', 'Count'],
            [
                ['Steps inserted or previewed', $created],
                ['Versions skipped', $skipped],
                ['Versions failed', $failed],
            ]
        );

        if ($dryRun) {
            $this->comment(
                'Dry run complete. No database records were inserted.'
            );
        }

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
