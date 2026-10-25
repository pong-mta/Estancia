<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\DocumentWorkflow;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicTrackingController extends Controller
{
    public function show(Request $request): Response
    {
        $validated = $request->validate([
            'tracking_number' => ['nullable', 'string', 'max:50'],
        ]);

        $trackingNumber = trim(
            (string) ($validated['tracking_number'] ?? '')
        );

        $documentData = null;

        if ($trackingNumber !== '') {
            $document = Document::query()
                ->where('tracking_number', $trackingNumber)
                // Do not expose documents that have not been submitted.
                ->where('status', '!=', 'draft')
                ->first();

            if ($document) {
                $assignment = DocumentWorkflow::query()
                    ->with([
                        'workflowVersion.steps',
                        'actions',
                    ])
                    ->where('document_type', $document->document_type)
                    ->where('document_id', $document->id)
                    ->orderByDesc('id')
                    ->first();

                $timeline = [];

                if ($assignment && $assignment->workflowVersion) {
                    $steps = $assignment->workflowVersion->steps
                        ->sortBy('position')
                        ->values();

                    foreach ($steps as $step) {
                        $action = $assignment->actions->first(
                            function ($action) use ($step) {
                                if (
                                    $action->workflow_version_step_id !== null
                                ) {
                                    return (int) $action->workflow_version_step_id
                                        === (int) $step->id;
                                }

                                return $step->original_step_id !== null
                                    && $action->workflow_step_id !== null
                                    && (int) $action->workflow_step_id
                                        === (int) $step->original_step_id;
                            }
                        );

                        if ($action) {
                            $stepStatus = $action->action === 'rejected'
                                ? 'rejected'
                                : 'completed';
                        } elseif (
                            $assignment->status === 'rejected'
                        ) {
                            $stepStatus = 'not_reached';
                        } elseif (
                            $assignment->status === 'in_progress'
                            && (int) $assignment->current_version_step_id
                                === (int) $step->id
                        ) {
                            $stepStatus = 'current';
                        } elseif (
                            $assignment->status === 'completed'
                        ) {
                            $stepStatus = 'not_reached';
                        } else {
                            $stepStatus = 'pending';
                        }

                        $timeline[] = [
                            'name' => $step->name,
                            'position' => $step->position,
                            'status' => $stepStatus,
                            'acted_at' => $action?->acted_at
                                ? $action->acted_at->format('M d, Y h:i A')
                                : null,
                        ];
                    }
                }

                $documentData = [
                    'tracking_number' => $document->tracking_number,
                    'subject' => $document->subject,
                    'document_type' => $document->document_type,
                    'status' => $document->status,
                    'submitted_at' => $document->submitted_at
                        ? $document->submitted_at->format('M d, Y h:i A')
                        : null,
                    'completed_at' => $document->completed_at
                        ? $document->completed_at->format('M d, Y h:i A')
                        : null,
                    'timeline' => $timeline,
                ];
            }
        }

        return Inertia::render('public/tracking', [
            'trackingNumber' => $trackingNumber,
            'document' => $documentData,
            'searched' => $trackingNumber !== '',
        ]);
    }
}
