import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Plus, X, User as UserIcon } from 'lucide-react'
import api from '@/lib/api'
import { AssignedTeamMember, TeamMember } from '@/types/team-member'
import { Badge } from '@/components/ui/badge'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface TeamMemberSelectorProps {
    value?: AssignedTeamMember[]
    onChange: (members: AssignedTeamMember[]) => void
}

export function TeamMemberSelector({ value = [], onChange }: TeamMemberSelectorProps) {
    const [open, setOpen] = useState(false)
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
    const [roleOverride, setRoleOverride] = useState('')

    // Fetch master list
    const { data: allMembers = [] } = useQuery({
        queryKey: ['settings', 'team_members'],
        queryFn: async () => {
            const response = await api.get('/settings/team_members')
            const rawValue = response.data.setting?.settingValue
            if (!rawValue) return []
            try {
                return typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue
            } catch {
                return []
            }
        }
    })

    const handleAdd = () => {
        if (!selectedMember) return

        const newMember: AssignedTeamMember = {
            name: selectedMember.name,
            role: roleOverride || selectedMember.role
        }

        onChange([...value, newMember])

        // Reset selection
        setSelectedMember(null)
        setRoleOverride('')
        setOpen(false)
    }

    const handleRemove = (index: number) => {
        const newValue = [...value]
        newValue.splice(index, 1)
        onChange(newValue)
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                {value.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">Belum ada tim yang ditugaskan.</p>
                )}
                {value.map((member, index) => (
                    <Badge key={index} variant="secondary" className="pl-2 pr-1 h-8 gap-2">
                        <div className="flex items-center gap-1">
                            <UserIcon className="h-3 w-3" />
                            <span>{member.name}</span>
                            <span className="text-muted-foreground mx-1">•</span>
                            <span className="text-xs font-normal">{member.role}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 rounded-full hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleRemove(index)}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </Badge>
                ))}
            </div>

            <div className="flex gap-2 items-end">
                <Popover modal={false} open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={open} className="justify-between min-w-[200px]">
                            {selectedMember ? selectedMember.name : "Pilih Anggota Tim..."}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Cari anggota tim..." />
                            <CommandList>
                                <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                                <CommandGroup>
                                    {allMembers.map((member: TeamMember, index: number) => (
                                        <CommandItem
                                            key={member.id || index}
                                            value={member.id?.toString() || `${member.name}`}
                                            onSelect={() => {
                                                setSelectedMember(member)
                                                setRoleOverride(member.role)
                                                setOpen(false)
                                            }}
                                        >
                                            <div className="flex flex-col">
                                                <span>{member.name}</span>
                                                <span className="text-xs text-muted-foreground">{member.role}</span>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                {selectedMember && (
                    <div className="flex gap-2 items-end animate-in fade-in slide-in-from-left-2">
                        <div className="space-y-1 w-[150px]">
                            <Label className="text-xs">Role / Tugas</Label>
                            <Input
                                value={roleOverride}
                                onChange={(e) => setRoleOverride(e.target.value)}
                                className="h-10"
                            />
                        </div>
                        <Button onClick={handleAdd} size="icon" className="h-10 w-10">
                            <Plus className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setSelectedMember(null)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
