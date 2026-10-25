<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('document_workflows', function (Blueprint $table) {
            $table->foreignId('current_version_step_id')
                ->nullable()
                ->after('current_step_id')
                ->constrained('workflow_version_steps')
                ->nullOnDelete();
        });

        /*
         * Backfill the new column only when a matching immutable step exists.
         * The original current_step_id is never modified.
         */
        DB::table('document_workflows')
            ->whereNotNull('current_step_id')
            ->orderBy('id')
            ->chunkById(100, function ($assignments) {
                foreach ($assignments as $assignment) {
                    $versionStepId = DB::table('workflow_version_steps')
                        ->where(
                            'workflow_version_id',
                            $assignment->workflow_version_id
                        )
                        ->where(
                            'original_step_id',
                            $assignment->current_step_id
                        )
                        ->value('id');

                    if ($versionStepId !== null) {
                        DB::table('document_workflows')
                            ->where('id', $assignment->id)
                            ->update([
                                'current_version_step_id' => $versionStepId,
                            ]);
                    }
                }
            });
    }

    public function down(): void
    {
        Schema::table('document_workflows', function (Blueprint $table) {
            $table->dropForeign(['current_version_step_id']);
            $table->dropColumn('current_version_step_id');
        });
    }
};
