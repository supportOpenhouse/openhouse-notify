"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"

export function CampaignForm() {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Create Campaign</CardTitle>
        <CardDescription>Use the campaign builder to create and dispatch FCM notifications.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href="/admin/campaigns/new">
            <Plus className="mr-2 size-4" />
            New Campaign
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
