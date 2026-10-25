<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentAttachmentController extends Controller
{
    /**
     * Display an attachment inline when its file type is safe to preview.
     */
    public function view(Request $request, int $attachment): StreamedResponse
    {
        $file = $this->findAuthorizedAttachment($request, $attachment);

        $disk = Storage::disk($file->disk);
        abort_unless($disk->exists($file->file_path), 404, 'Attachment file not found.');

        $mimeType = $file->mime_type ?: 'application/octet-stream';

        $previewableTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
        ];

        if (! in_array($mimeType, $previewableTypes, true)) {
            return $this->downloadResponse($file);
        }

        return response()->stream(
            function () use ($disk, $file) {
                $stream = $disk->readStream($file->file_path);

                abort_if($stream === false, 404, 'Unable to read attachment.');

                try {
                    fpassthru($stream);
                } finally {
                    if (is_resource($stream)) {
                        fclose($stream);
                    }
                }
            },
            200,
            [
                'Content-Type' => $mimeType,
                'Content-Disposition' => 'inline; filename="' .
                    addcslashes(basename($file->original_name), '"\\') . '"',
                'X-Content-Type-Options' => 'nosniff',
                'Cache-Control' => 'private, no-store',
            ]
        );
    }

    /**
     * Download an attachment.
     */
    public function download(Request $request, int $attachment): StreamedResponse
    {
        $file = $this->findAuthorizedAttachment($request, $attachment);

        return $this->downloadResponse($file);
    }

    /**
     * Find the attachment and verify that the logged-in user is authorized
     * to access the document at its current approval step.
     */
    private function findAuthorizedAttachment(Request $request, int $attachment): object
    {
        $user = $request->user();

        abort_unless($user, 401);

        if (isset($user->is_active) && ! $user->is_active) {
            abort(403, 'Your account is inactive.');
        }

        $file = DB::table('document_attachments as attachments')
            ->join('documents', 'documents.id', '=', 'attachments.document_id')
            ->where('attachments.id', $attachment)
            ->whereNull('documents.deleted_at')
            ->select([
                'attachments.id',
                'attachments.document_id',
                'attachments.original_name',
                'attachments.file_path',
                'attachments.disk',
                'attachments.mime_type',
                'documents.document_type',
            ])
            ->first();

        abort_unless($file, 404, 'Attachment not found.');

        $workflowQuery = DB::table('document_workflows')
            ->join(
                'workflow_version_steps',
                'workflow_version_steps.id',
                '=',
                'document_workflows.current_version_step_id'
            )
            ->where('document_workflows.document_type', $file->document_type)
            ->where('document_workflows.document_id', $file->document_id)
            ->where('document_workflows.status', 'in_progress')
            ->whereIn('workflow_version_steps.step_type', ['approval', 'review']);

        $workflowQuery->where(function ($query) use ($user) {
            $matched = false;

            if (isset($user->id)) {
                $query->where('workflow_version_steps.approver_id', $user->id);
                $matched = true;
            }

            if (isset($user->office_id) && $user->office_id !== null) {
                $method = $matched ? 'orWhere' : 'where';

                $query->{$method}(
                    'workflow_version_steps.office_id',
                    $user->office_id
                );
            }
        });

        abort_unless($workflowQuery->exists(), 403, 'You are not authorized to access this attachment.');

        return $file;
    }

    /**
     * Stream the original file as a download.
     */
    private function downloadResponse(object $file): StreamedResponse
    {
        $disk = Storage::disk($file->disk);

        abort_unless($disk->exists($file->file_path), 404, 'Attachment file not found.');

        $stream = $disk->readStream($file->file_path);

        abort_if($stream === false, 404, 'Unable to read attachment.');

        return response()->streamDownload(
            function () use ($stream) {
                try {
                    fpassthru($stream);
                } finally {
                    if (is_resource($stream)) {
                        fclose($stream);
                    }
                }
            },
            basename($file->original_name),
            [
                'Content-Type' => $file->mime_type ?: 'application/octet-stream',
                'X-Content-Type-Options' => 'nosniff',
                'Cache-Control' => 'private, no-store',
            ]
        );
    }
}
