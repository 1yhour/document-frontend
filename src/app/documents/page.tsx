"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRightLeft,
  CheckCircle2,
  Download,
  FileCheck,
  FileUp,
  Lock,
  Shield,
  UploadCloud,
} from "lucide-react";

export default function DocumentsPage() {
  const { user, can } = useAuth();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Document Converter
          </h1>
          <p className="text-sm text-muted-foreground">
            Convert your documents securely between formats (PDF, DOCX, XLSX).
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border bg-card p-2 text-xs">
          <span className="text-muted-foreground">Signed in as:</span>
          <span className="font-semibold text-foreground">{user?.email}</span>
          <span className="rounded bg-primary/10 px-2 py-0.5 font-medium text-primary capitalize">
            {user?.roles?.[0] || "user"}
          </span>
        </div>
      </div>

      {/* Role & Permissions Status Panel (UX Convenience demonstration) */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2">
          <Shield className="h-4 w-4 text-primary" />
          Active Account Permissions (from Spatie)
        </h2>
        <div className="flex flex-wrap gap-2">
          {user?.permissions?.map((perm) => (
            <span
              key={perm}
              className="inline-flex items-center gap-1 rounded-md bg-background px-2.5 py-1 text-xs font-medium text-foreground border shadow-xs"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              {perm}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Section 1: Convert Documents (gated by 'convert documents') */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              Convert New Document
            </CardTitle>
            <CardDescription>
              Upload documents to convert to your preferred output format.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between">
            {can("convert documents") ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center hover:border-primary/50 transition-colors">
                  <UploadCloud className="h-10 w-10 text-muted-foreground/75 mb-2" />
                  <p className="text-sm font-medium">Drag & drop files or browse</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports PDF, DOCX, PPTX up to 25MB
                  </p>
                </div>
                <Button className="w-full">
                  <FileUp className="mr-2 h-4 w-4" />
                  Select Document to Convert
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-8 text-center text-muted-foreground space-y-2">
                <Lock className="h-8 w-8 text-muted-foreground/60" />
                <p className="text-sm font-medium">Conversion Disabled</p>
                <p className="text-xs">
                  Your account does not hold the &quot;convert documents&quot; permission.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Converted Files & Download UI (gated by 'download converted files') */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              Converted Documents
            </CardTitle>
            <CardDescription>
              Recently converted files ready for preview and download.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="divide-y divide-border rounded-md border">
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <FileCheck className="h-8 w-8 text-primary/80" />
                  <div>
                    <p className="text-sm font-medium">Q3_Financial_Report.docx</p>
                    <p className="text-xs text-muted-foreground">PDF &rarr; DOCX &bull; 1.4 MB</p>
                  </div>
                </div>

                {/* Download UI gated strictly by permission */}
                {can("download converted files") ? (
                  <Button variant="outline" size="sm">
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Download
                  </Button>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground italic">
                    <Lock className="h-3 w-3" />
                    Download locked
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <FileCheck className="h-8 w-8 text-primary/80" />
                  <div>
                    <p className="text-sm font-medium">Technical_Spec_2026.pdf</p>
                    <p className="text-xs text-muted-foreground">DOCX &rarr; PDF &bull; 850 KB</p>
                  </div>
                </div>

                {can("download converted files") ? (
                  <Button variant="outline" size="sm">
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Download
                  </Button>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground italic">
                    <Lock className="h-3 w-3" />
                    Download locked
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
