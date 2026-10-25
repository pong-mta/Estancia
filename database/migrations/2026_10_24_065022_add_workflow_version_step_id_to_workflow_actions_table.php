<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workflow_actions', function (Blueprint $table) {
            $table->foreignId('workflow_version_step_id')
                ->nullable()
                ->after('workflow_step_id')
                ->constrained('workflow_version_steps')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('workflow_actions', function (Blueprint $table) {
            $table->dropForeign(['workflow_version_step_id']);
            $table->dropColumn('workflow_version_step_id');
        });
    }
};
