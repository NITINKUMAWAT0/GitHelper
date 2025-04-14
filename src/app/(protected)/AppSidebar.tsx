'use client'

import { Button } from "@/components/ui/button";
// Make sure the sidebar import is correct
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
import { Bot, CreditCard, LayoutDashboardIcon, Plus, Presentation } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import GitHubLogo from "../images/GithubLogo.png";
import useProject from "@/hooks/useProject";

const items = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboardIcon
    }, {
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
    const { projects = [], projectId, setProjectId } = useProject() || {};
    
    return (
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
                                                    <div onClick={() => {
                                                        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                                                        setProjectId && setProjectId(project.id);
                                                    }}>
                                                        <div className={cn(
                                                            `rounded-sm border size-6 flex items-center justify-center text-sm bg-white text-primary`,
                                                            {
                                                                'bg-primary text-white': project.id === projectId
                                                            }
                                                        )}>
                                                            {project.name[0]}
                                                        </div>
                                                        <span>{project.name}</span>
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
    );
}