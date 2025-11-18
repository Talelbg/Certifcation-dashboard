import React, { useState, useEffect } from 'react';
import { Event } from '../types';
import { CalendarIcon, PlusIcon, TrashIcon, PencilIcon } from './icons';

interface EventsDashboardProps {
    events: Event[];
    onSave: (event: Omit<Event, 'id'>, id?: string) => void;
    onDelete: (id: string) => void;
}

const EventForm = ({
    onSave,
    editingEvent,
    clearEditing,
}: {
    onSave: (event: Omit<Event, 'id'>, id?: string) => void;
    editingEvent: Event | null;
    clearEditing: () => void;
}) => {
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'upcoming' | 'past'>('upcoming');

    useEffect(() => {
        if (editingEvent) {
            setName(editingEvent.name);
            setDate(editingEvent.date);
            setDescription(editingEvent.description);
            setType(editingEvent.type);
        } else {
            setName('');
            setDate('');
            setDescription('');
            setType('upcoming');
        }
    }, [editingEvent]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !date) {
            alert('Event name and date are required.');
            return;
        }
        onSave({ name, date, description, type }, editingEvent?.id);
        clearEditing();
    };

    return (
        <form onSubmit={handleSubmit} className="bg-brand-surface p-4 rounded-lg shadow-lg space-y-4 mb-6">
             <h3 className="font-bold text-lg text-brand-text">{editingEvent ? 'Edit Event' : 'Add New Event'}</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <input type="text" placeholder="Event Name" value={name} onChange={e => setName(e.target.value)} className="bg-brand-border text-brand-text rounded px-3 py-2" required />
                 <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-brand-border text-brand-text rounded px-3 py-2" required />
             </div>
             <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-brand-border text-brand-text rounded px-3 py-2" rows={3}></textarea>
             <div className="flex items-center space-x-4">
                <label className="text-brand-text-secondary">Type:</label>
                <div className="flex items-center">
                    <input type="radio" id="upcoming" name="type" value="upcoming" checked={type === 'upcoming'} onChange={() => setType('upcoming')} className="mr-2"/>
                    <label htmlFor="upcoming">Upcoming</label>
                </div>
                 <div className="flex items-center">
                    <input type="radio" id="past" name="type" value="past" checked={type === 'past'} onChange={() => setType('past')} className="mr-2"/>
                    <label htmlFor="past">Past</label>
                </div>
             </div>
             <div className="flex justify-end space-x-2">
                 {editingEvent && <button type="button" onClick={clearEditing} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>}
                 <button type="submit" className="bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-2 px-4 rounded-lg flex items-center">
                    <PlusIcon className="mr-2" />
                    {editingEvent ? 'Save Changes' : 'Add Event'}
                </button>
             </div>
        </form>
    )
}

// FIX: Defined a named interface for props to resolve issue with 'key' prop.
interface EventCardProps {
    event: Event;
    onEdit: (event: Event) => void;
    onDelete: (id: string) => void;
}

// FIX: Changed component to be typed with React.FC to correctly handle the `key` prop.
const EventCard: React.FC<EventCardProps> = ({ event, onEdit, onDelete }) => {
    return (
        <div className="bg-brand-bg p-4 rounded-lg border border-brand-border">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-brand-text">{event.name}</h4>
                    <p className="text-sm text-brand-text-secondary flex items-center"><CalendarIcon /> <span className="ml-2">{new Date(event.date).toLocaleDateString()}</span></p>
                </div>
                <div className="flex space-x-2">
                     <button onClick={() => onEdit(event)} className="text-brand-text-secondary hover:text-brand-primary"><PencilIcon /></button>
                     <button onClick={() => onDelete(event.id)} className="text-brand-text-secondary hover:text-red-500"><TrashIcon /></button>
                </div>
            </div>
            <p className="mt-2 text-sm text-brand-text-secondary">{event.description}</p>
        </div>
    );
};


export const EventsDashboard = ({ events, onSave, onDelete }: EventsDashboardProps) => {
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);

    const upcomingEvents = events.filter(e => e.type === 'upcoming').sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const pastEvents = events.filter(e => e.type === 'past').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div>
            <EventForm onSave={onSave} editingEvent={editingEvent} clearEditing={() => setEditingEvent(null)} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="font-bold text-xl mb-4 text-brand-text">Upcoming Events</h3>
                    <div className="space-y-4">
                        {upcomingEvents.length > 0 ? (
                            upcomingEvents.map(event => <EventCard key={event.id} event={event} onEdit={setEditingEvent} onDelete={onDelete} />)
                        ) : (
                            <p className="text-brand-text-secondary">No upcoming events scheduled.</p>
                        )}
                    </div>
                </div>
                 <div>
                    <h3 className="font-bold text-xl mb-4 text-brand-text">Past Events</h3>
                    <div className="space-y-4">
                        {pastEvents.length > 0 ? (
                            pastEvents.map(event => <EventCard key={event.id} event={event} onEdit={setEditingEvent} onDelete={onDelete} />)
                        ) : (
                            <p className="text-brand-text-secondary">No past events recorded.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};