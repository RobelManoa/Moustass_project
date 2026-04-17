import {
  Create,
  CreateButton,
  Datagrid,
  DateField,
  DeleteButton,
  Edit,
  EditButton,
  EmailField,
  ExportButton,
  List,
  PasswordInput,
  SelectField,
  SelectInput,
  Show,
  ShowButton,
  SimpleForm,
  SimpleShowLayout,
  TextField,
  TextInput,
  TopToolbar,
} from "react-admin";

const roleChoices = [
  { id: "USER", name: "Utilisateur" },
  { id: "ADMIN", name: "Administrateur" },
];

const userFilters = [
  <TextInput key="q" source="q" label="Recherche" alwaysOn />,
  <SelectInput key="role" source="role" label="Role" choices={roleChoices} />,
];

const UserListActions = () => (
  <TopToolbar>
    <CreateButton />
    <ExportButton />
  </TopToolbar>
);

export const UserList = () => (
  <List
    actions={<UserListActions />}
    filters={userFilters}
    perPage={10}
    sort={{ field: "createdAt", order: "DESC" }}
  >
    <Datagrid rowClick="show" bulkActionButtons={false}>
      <TextField source="name" label="Nom" />
      <EmailField source="email" label="Email" />
      <SelectField source="role" label="Role" choices={roleChoices} />
      <DateField source="createdAt" label="Cree le" showTime />
      <ShowButton />
      <EditButton />
      <DeleteButton mutationMode="pessimistic" />
    </Datagrid>
  </List>
);

export const UserShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="name" label="Nom" />
      <EmailField source="email" label="Email" />
      <SelectField source="role" label="Role" choices={roleChoices} />
      <DateField source="createdAt" label="Cree le" showTime />
      <DateField source="updatedAt" label="Mis a jour le" showTime />
    </SimpleShowLayout>
  </Show>
);

export const UserCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" label="Nom" fullWidth />
      <TextInput source="email" label="Email" type="email" fullWidth />
      <PasswordInput source="password" label="Mot de passe" fullWidth />
      <SelectInput source="role" label="Role" choices={roleChoices} fullWidth />
    </SimpleForm>
  </Create>
);

export const UserEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" disabled fullWidth />
      <TextInput source="name" label="Nom" fullWidth />
      <TextInput source="email" label="Email" disabled fullWidth />
      <PasswordInput
        source="password"
        label="Nouveau mot de passe"
        helperText="Laissez vide pour conserver le mot de passe actuel."
        fullWidth
      />
      <SelectInput source="role" label="Role" choices={roleChoices} fullWidth />
    </SimpleForm>
  </Edit>
);
