'use client'

import { Button } from "@/components/ui/button";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  useSidebar 
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Archive, Bot, CreditCard, LayoutDashboardIcon, Plus, Presentation, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import GitHubLogo from "../images/GithubLogo.png";
import useProject from "@/hooks/useProject";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const items = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboardIcon
    },{
        title: "Archives",
        url:"/archives",
        icon: Archive
    },{
        title: "Q&A",
        url: "/qa",
        icon: Bot
    }, {
        title: "Meetings",
        url: "/meetings",
        icon: Presentation
    }, {
        title: "Billing",
        url: "/billing",
        icon: CreditCard
    }
];

export function AppSidebar() {
    const pathname = usePathname();
    const { open } = useSidebar();
    const { projects = [], projectId, setProjectId} = useProject() || {};
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
    
    // Access the deleteProject mutation
    const deleteProjectMutation = api.project.deleteProject.useMutation({
        onSuccess: () => {
            toast.success("Project deleted", {
                description: "Your project has been deleted successfully."
            });
                refetchProjects();
            // If the deleted project was the current active one, reset projectId
            if (projectId === projectToDelete && setProjectId) {
                setProjectId("");
            }
        },
        onError: (error) => {
            toast.error("Error", {
                description: `Failed to delete project: ${error.message}`
            });
        }
    });

    const handleDeleteClick = (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        setProjectToDelete(projectId);
    };

    const confirmDelete = () => {
        if (projectToDelete) {
            deleteProjectMutation.mutate({ projectId: projectToDelete });
            setProjectToDelete(null);
        }
    };

    const cancelDelete = () => {
        setProjectToDelete(null);
    };
    
    return (
        <>
            <Sidebar collapsible="icon" variant="floating">
                <SidebarHeader>
                    <div className="flex items-center gap-2">
                        <Image src={GitHubLogo} alt="logo" width={40} height={40} />
                        {open && (
                            <h1 className="text-2xl font-bold text-black">Helper</h1>
                        )}
                    </div>
                </SidebarHeader>
                <SidebarContent>

                    {/* upper sidebar group */}
                    <SidebarGroup>
                        <SidebarGroupLabel>
                            Application
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                            {items.map(item => {
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild>
                                            <Link href={item.url} className={cn({
                                                '!bg-primary !text-white': pathname === item.url
                                            }, 'list-none')}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>

                    {/* lower sidebar group */}
                    <SidebarGroup>
                        <SidebarGroupLabel>
                             Your Projects
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                    {projects && projects.length > 0 ? (
                                        projects.map(project => {
                                            return (
                                                <SidebarMenuItem key={project.name}>
                                                    <SidebarMenuButton asChild>
                                                        <div 
                                                            onClick={() => {
                                                                if (setProjectId) setProjectId(project.id);
                                                            }}
                                                            className="flex items-center justify-between w-full"
                                                        >
                                                            <div className="flex items-center">
                                                                <div className={cn(
                                                                    `rounded-sm border size-6 flex items-center justify-center text-sm bg-white text-primary`,
                                                                    {
                                                                        'bg-primary text-white': project.id === projectId
                                                                    }
                                                                )}>
                                                                    {project.name[0]}
                                                                </div>
                                                                <span className="ml-2">{project.name}</span>
                                                            </div>
                                                            <button 
                                                                onClick={(e) => handleDeleteClick(e, project.id)}
                                                                className="ml-4 p-1 rounded-sm hover:bg-gray-100 transition-colors"
                                                                aria-label="Delete project"
                                                            >
                                                                <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
                                                            </button>
                                                        </div>
                                                    </SidebarMenuButton>
                                                </SidebarMenuItem>
                                            )
                                        })
                                    ) : (
                                        <SidebarMenuItem>
                                            <div className="text-sm text-muted-foreground px-2">No projects yet</div>
                                        </SidebarMenuItem>
                                    )}

                                    <div className="h-2">
                                        <SidebarMenuItem>
                                            <Link href="/create">
                                            <Button size='sm' variant="outline" className="w-fit mt-4">
                                                <Plus/>
                                                Create Project 
                                            </Button>
                                            </Link>
                                        </SidebarMenuItem>
                                    </div>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
            </Sidebar>

            {/* Confirmation Dialog */}
            <AlertDialog open={projectToDelete !== null} onOpenChange={() => setProjectToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the project
                            and all associated data including questions, meetings, and commits.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmDelete} 
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function refetchProjects() {
    throw new Error("Function not implemented.");
}
