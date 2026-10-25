
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->string('budget_availability', 30)->nullable();
            $table->text('budget_remarks')->nullable();

            $table->foreignId('funding_source_assigned_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('funding_source_assigned_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropForeign(['funding_source_assigned_by']);

            $table->dropColumn([
                'budget_availability',
                'budget_remarks',
                'funding_source_assigned_by',
                'funding_source_assigned_at',
            ]);
        });
    }
};
