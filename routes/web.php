
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\OfficeController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\WorkflowController;
use App\Http\Controllers\Admin\WorkflowStepController;
use App\Http\Controllers\Admin\WorkflowActionController;
use App\Http\Controllers\Admin\DocumentController;
use App\Http\Controllers\Admin\PendingApprovalController;
use App\Http\Controllers\Admin\DocumentHistoryController;
use App\Http\Controllers\PublicTrackingController;
use App\Http\Controllers\Admin\ProcurementController;
use App\Http\Controllers\Admin\SupplierController;
use App\Http\Controllers\Admin\SupplierQuotationController;
use App\Http\Middleware\EnsureGsoOffice;
use App\Http\Controllers\Mdrrmo\OperationsDashboardController;
use App\Http\Middleware\EnsureMdrrmoOperationsAdmin;
use App\Http\Controllers\Mdrrmo\AmbulanceController;
use App\Http\Controllers\Mdrrmo\PersonnelController;
use App\Http\Controllers\Mdrrmo\BookingRequestController;

Route::inertia('/', 'welcome')->name('home');

Route::get('/track-document', [PublicTrackingController::class, 'show'])
    ->name('public.documents.track');

Route::middleware(['auth'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

Route::middleware(['auth'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        // Offices
        Route::get('/offices', [OfficeController::class, 'index'])
            ->name('offices.index');

        Route::post('/offices', [OfficeController::class, 'store'])
            ->name('offices.store');

        Route::put('/offices/{office}', [OfficeController::class, 'update'])
            ->name('offices.update');

        Route::delete('/offices/{office}', [OfficeController::class, 'destroy'])
            ->name('offices.destroy');

        // Users
        Route::get('/users', [UserController::class, 'index'])
            ->name('users.index');

        Route::post('/users', [UserController::class, 'store'])
            ->name('users.store');

        Route::put('/users/{user}', [UserController::class, 'update'])
            ->name('users.update');

        Route::delete('/users/{user}', [UserController::class, 'destroy'])
            ->name('users.destroy');

        // Workflow management
        Route::get('/workflows', [WorkflowController::class, 'index'])
            ->name('workflows.index');

        Route::post('/workflows', [WorkflowController::class, 'store'])
            ->name('workflows.store');

        Route::put('/workflows/{workflow}', [WorkflowController::class, 'update'])
            ->name('workflows.update');

        // Workflow steps
        Route::get(
            '/workflows/{workflow}/steps',
            [WorkflowStepController::class, 'index']
        )->name('workflows.steps.index');

        Route::post(
            '/workflows/{workflow}/steps',
            [WorkflowStepController::class, 'store']
        )->name('workflows.steps.store');

        // IMPORTANT: Register reorder as its own route.
        Route::put(
            '/workflows/{workflow}/steps/reorder',
            [WorkflowStepController::class, 'reorder']
        )->name('workflows.steps.reorder');

        // Step IDs must be numeric so "reorder" cannot match {step}.
        Route::put(
            '/workflows/{workflow}/steps/{step}',
            [WorkflowStepController::class, 'update']
        )->whereNumber('step')
            ->name('workflows.steps.update');

        Route::delete(
            '/workflows/{workflow}/steps/{step}',
            [WorkflowStepController::class, 'destroy']
        )->whereNumber('step')
            ->name('workflows.steps.destroy');

        // Workflow publishing and versions
        Route::post(
            '/workflows/{workflow}/publish',
            [WorkflowController::class, 'publish']
        )->name('workflows.publish');

        Route::post(
            '/workflows/{workflow}/new-version',
            [WorkflowController::class, 'createNewVersion']
        )->name('workflows.new-version');

        Route::get(
            '/workflows/{workflow}/history',
            [WorkflowController::class, 'versionHistory']
        )->name('workflows.history');

        // Document workflow actions
        Route::post(
            '/document-workflows/{documentWorkflow}/approve',
            [WorkflowActionController::class, 'approve']
        )->name('document-workflows.approve');

        Route::post(
            '/document-workflows/{documentWorkflow}/reject',
            [WorkflowActionController::class, 'reject']
        )->name('document-workflows.reject');

        // Budget review
        Route::post(
            '/document-workflows/{documentWorkflow}/budget-review',
            [WorkflowActionController::class, 'saveBudgetReview']
        )->name('document-workflows.budget-review');

        // Documents
        Route::get('/documents', [DocumentController::class, 'index'])
            ->name('documents.index');

        Route::get(
            '/attachments/{attachment}/view',
            [\App\Http\Controllers\Admin\DocumentAttachmentController::class, 'view']
        )->name('attachments.view');

        Route::get(
            '/attachments/{attachment}/download',
            [\App\Http\Controllers\Admin\DocumentAttachmentController::class, 'download']
        )->name('attachments.download');

        Route::post('/documents', [DocumentController::class, 'store'])
            ->name('documents.store');

        Route::post(
            '/documents/{document}/submit',
            [DocumentController::class, 'submitDraft']
        )->name('documents.submit');

        Route::put('/documents/{document}', [
            DocumentController::class,
            'update',
        ])->name('documents.update');

        Route::delete('/documents/{document}', [
            DocumentController::class,
            'destroy',
        ])->name('documents.destroy');

        // Approvals and history
        Route::get(
            '/pending-approvals',
            [PendingApprovalController::class, 'index']
        )->name('pending-approvals.index');

        Route::get(
            '/document-history',
            [DocumentHistoryController::class, 'index']
        )->name('document-history.index');

        Route::get(
            '/document-history/{document}',
            [DocumentHistoryController::class, 'show']
        )->name('document-history.show');

        // Procurement
        Route::get('/procurement', [ProcurementController::class, 'index'])
            ->name('procurement.index');

        // GSO-only supplier and procurement operations
        Route::middleware(EnsureGsoOffice::class)->group(function () {
            Route::get('/suppliers', [SupplierController::class, 'index'])
                ->name('suppliers.index');

            Route::post('/suppliers', [SupplierController::class, 'store'])
                ->name('suppliers.store');

            Route::put('/suppliers/{supplier}', [SupplierController::class, 'update'])
                ->name('suppliers.update');

            Route::patch(
                '/suppliers/{supplier}/toggle-active',
                [SupplierController::class, 'toggleActive']
            )->name('suppliers.toggle-active');

            Route::post(
                '/procurement/{document}/start',
                [ProcurementController::class, 'start']
            )->name('procurement.start');

            Route::get(
                '/procurement/{procurement}',
                [ProcurementController::class, 'show']
            )->name('procurement.show');

            Route::post(
                '/procurement/{procurement}/quotations',
                [SupplierQuotationController::class, 'store']
            )->name('procurement.quotations.store');

            Route::delete(
                '/procurement/{procurement}/quotations/{quotation}',
                [SupplierQuotationController::class, 'destroy']
            )->name('procurement.quotations.destroy');
        });

    });

    // MDRRMO Operations Admin-only routes
    Route::middleware([
        'auth',
        EnsureMdrrmoOperationsAdmin::class,
    ])
        ->prefix('mdrrmo')
        ->name('mdrrmo.')
        ->group(function () {
            Route::get('/operations', OperationsDashboardController::class)
                ->name('operations.dashboard');
                
            Route::resource('ambulances', AmbulanceController::class);
            

            Route::resource('personnel', PersonnelController::class)
                ->except(['create', 'edit', 'destroy']);

            Route::patch(
                '/personnel/{personnel}/deactivate',
                [PersonnelController::class, 'deactivate']
            )->name('personnel.deactivate');

            Route::patch(
                '/personnel/{personnel}/reactivate',
                [PersonnelController::class, 'reactivate']
            )->name('personnel.reactivate');

            Route::get('/bookings', [BookingRequestController::class, 'index'])
                ->name('bookings.index');

            Route::post('/bookings', [BookingRequestController::class, 'store'])
                ->name('bookings.store');

            Route::get('/bookings/{booking}', [BookingRequestController::class, 'show'])
                ->name('bookings.show');

            Route::patch('/bookings/{booking}/approve', [BookingRequestController::class, 'approve'])
                ->name('bookings.approve');

            Route::patch('/bookings/{booking}/reject', [BookingRequestController::class, 'reject'])
                ->name('bookings.reject');
        });


        // Route::post('/bookings/public', [BookingRequestController::class, 'store']);

require __DIR__ . '/settings.php';
