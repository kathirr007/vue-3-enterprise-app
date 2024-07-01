import $api from '@/plugins/api';
import type {
  CreateUpdateNote,
  Note,
  NoteResourceType,
} from '@/types/note.type';

export const useNotes = () => {
  const getAll = async (id: string, type: NoteResourceType) => {
    const { data } = await $api.get<Note[]>(`notes/${type}?resourceId=${id}`);
    return data.map((note) => ({
      ...note,
      content: JSON.parse(note.content as unknown as string),
      isEditing: false,
    }));
  };

  const create = async (payload: CreateUpdateNote, type: NoteResourceType) => {
    const { data } = await $api.post<Note>(`notes/${type}`, payload);
    return data;
  };

  const update = async (
    id: string,
    payload: CreateUpdateNote,
    type: NoteResourceType
  ) => {
    const { data } = await $api.patch<Note>(`notes/${type}/${id}`, payload);
    return data;
  };

  const remove = async (id: string, type: NoteResourceType) => {
    const { data } = await $api.delete<Note>(`notes/${type}/${id}`);
    return data;
  };

  return {
    getAll,
    create,
    update,
    remove,
  };
};
