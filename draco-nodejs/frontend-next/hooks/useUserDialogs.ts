import { useDialog } from './useDialog';
import { ContactType, ContactRoleType } from '@draco/shared-schemas';

export interface UserDialogs {
  // Edit Contact Dialog
  editContactDialog: {
    isOpen: boolean;
    data: ContactType | undefined;
    open: (contact: ContactType) => void;
    close: () => void;
  };

  // Create Contact Dialog
  createContactDialog: {
    isOpen: boolean;
    open: () => void;
    close: () => void;
  };

  // Delete Contact Dialog
  deleteContactDialog: {
    isOpen: boolean;
    data: ContactType | undefined;
    open: (contact: ContactType) => void;
    close: () => void;
  };

  // Assign Role Dialog
  assignRoleDialog: {
    isOpen: boolean;
    data: ContactType | undefined;
    open: (user: ContactType) => void;
    close: () => void;
  };

  // Remove Role Dialog
  removeRoleDialog: {
    isOpen: boolean;
    data: { user: ContactType; role: ContactRoleType } | undefined;
    open: (user: ContactType, role: ContactRoleType) => void;
    close: () => void;
  };

  // Confirmation Dialogs
  photoDeleteConfirmDialog: {
    isOpen: boolean;
    data: string | undefined; // contactId
    open: (contactId: string) => void;
    close: () => void;
  };

  revokeConfirmDialog: {
    isOpen: boolean;
    data: string | undefined; // contactId
    open: (contactId: string) => void;
    close: () => void;
  };

  autoRegisterDialog: {
    isOpen: boolean;
    data: ContactType | undefined;
    open: (contact: ContactType) => void;
    close: () => void;
  };

  autoRegisterConflictDialog: {
    isOpen: boolean;
    data:
      | {
          contact: ContactType;
          otherContactName?: string;
          otherContactId?: string;
          email?: string;
          message?: string;
        }
      | undefined;
    open: (data: {
      contact: ContactType;
      otherContactName?: string;
      otherContactId?: string;
      email?: string;
      message?: string;
    }) => void;
    close: () => void;
  };
}

export function useUserDialogs(): UserDialogs {
  const editContactDialog = useDialog<ContactType>();
  const createContactDialog = useDialog<never>();
  const deleteContactDialog = useDialog<ContactType>();
  const assignRoleDialog = useDialog<ContactType>();
  const removeRoleDialog = useDialog<{ user: ContactType; role: ContactRoleType }>();
  const photoDeleteConfirmDialog = useDialog<string>();
  const revokeConfirmDialog = useDialog<string>();
  const autoRegisterDialog = useDialog<ContactType>();
  const autoRegisterConflictDialog = useDialog<{
    contact: ContactType;
    otherContactName?: string;
    otherContactId?: string;
    email?: string;
    message?: string;
  }>();

  // Wrap the remove role dialog to accept two parameters
  const openRemoveRoleDialog = (user: ContactType, role: ContactRoleType) => {
    removeRoleDialog.open({ user, role });
  };

  return {
    editContactDialog: {
      isOpen: editContactDialog.isOpen,
      data: editContactDialog.data,
      open: editContactDialog.open,
      close: editContactDialog.close,
    },
    createContactDialog: {
      isOpen: createContactDialog.isOpen,
      open: () => createContactDialog.open(),
      close: createContactDialog.close,
    },
    deleteContactDialog: {
      isOpen: deleteContactDialog.isOpen,
      data: deleteContactDialog.data,
      open: deleteContactDialog.open,
      close: deleteContactDialog.close,
    },
    assignRoleDialog: {
      isOpen: assignRoleDialog.isOpen,
      data: assignRoleDialog.data,
      open: assignRoleDialog.open,
      close: assignRoleDialog.close,
    },
    removeRoleDialog: {
      isOpen: removeRoleDialog.isOpen,
      data: removeRoleDialog.data,
      open: openRemoveRoleDialog,
      close: removeRoleDialog.close,
    },
    photoDeleteConfirmDialog: {
      isOpen: photoDeleteConfirmDialog.isOpen,
      data: photoDeleteConfirmDialog.data,
      open: photoDeleteConfirmDialog.open,
      close: photoDeleteConfirmDialog.close,
    },
    revokeConfirmDialog: {
      isOpen: revokeConfirmDialog.isOpen,
      data: revokeConfirmDialog.data,
      open: revokeConfirmDialog.open,
      close: revokeConfirmDialog.close,
    },
    autoRegisterDialog: {
      isOpen: autoRegisterDialog.isOpen,
      data: autoRegisterDialog.data,
      open: autoRegisterDialog.open,
      close: autoRegisterDialog.close,
    },
    autoRegisterConflictDialog: {
      isOpen: autoRegisterConflictDialog.isOpen,
      data: autoRegisterConflictDialog.data,
      open: autoRegisterConflictDialog.open,
      close: autoRegisterConflictDialog.close,
    },
  };
}
