<?php

namespace App\Console\Commands;

use App\Models\WorkflowVersion;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

class NormalizeWorkflowVersionStepPositions extends Command
{
    protected $signature = 'workflows:normalize-version-step-positions
                            {--dry-run : Preview changes without modifying records}';

    protected $description = 'Normalize immutable workflow step positions within each published version';

    public function handle(): int
    {
        $versions = WorkflowVersion::query()
            ->where('status', 'published')
            ->with('steps')
            ->orderBy('id')
            ->get();

        $dryRun = (bool) $this->option('dry-run');
        $updated = 0;
        $unchanged = 0;
        $failed = 0;

        foreach ($versions as $version) {
            $steps = $version->steps
                ->sortBy('position')
                ->values();

            if ($steps->isEmpty()) {
                $this->warn(
                    "Version {$version->id}: no immutable steps; skipped."
                );

                $unchanged++;

                continue;
            }

            $changes = [];

            foreach ($steps as $index => $step) {
                $expectedPosition = $index + 1;

                if ((int) $step->position !== $expectedPosition) {
                    $changes[] = [
                        'id' => $step->id,
                        'old' => $step->position,
                        'new' => $expectedPosition,
                    ];
                }
            }

            if ($changes === []) {
                $this->line(
                    "Version {$version->id}: positions already normalized."
                );

                $unchanged++;

                continue;
            }

            if ($dryRun) {
                foreach ($changes as $change) {
                    $this->line(
                        "Version {$version->id}, step {$change['id']}: "
                        . "{$change['old']} -> {$change['new']}"
                    );
                }

                $updated += count($changes);

                continue;
            }

            try {
                DB::transaction(function () use ($version, $steps) {
                    $lockedVersion = WorkflowVersion::query()
                        ->whereKey($version->id)
                        ->lockForUpdate()
                        ->firstOrFail();

                    $lockedSteps = $lockedVersion->steps()
                        ->orderBy('position')
                        ->orderBy('id')
                        ->lockForUpdate()
                        ->get();

                    /*
                     * Move positions out of the normal range first to avoid
                     * conflicts with the unique version/position constraint.
                     */
                    $lockedVersion->steps()->update([
                        'position' => DB::raw('position + 1000000'),
                    ]);

                    foreach ($lockedSteps as $index => $step) {
                        $step->update([
                            'position' => $index + 1,
                        ]);
                    }
                });

                $updated += count($changes);

                $this->info(
                    "Version {$version->id}: normalized "
                    . count($changes)
                    . ' step position(s).'
                );
            } catch (Throwable $exception) {
                $failed++;

                $this->error(
                    "Version {$version->id} failed: "
                    . $exception->getMessage()
                );
            }
        }

        $this->newLine();

        $this->table(
            ['Result', 'Count'],
            [
                ['Positions updated or previewed', $updated],
                ['Versions unchanged or skipped', $unchanged],
                ['Versions failed', $failed],
            ]
        );

        if ($dryRun) {
            $this->comment('Dry run complete. No database records were modified.');
        }

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
