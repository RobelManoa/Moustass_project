import {
  Create,
  Datagrid,
  DateField,
  DeleteButton,
  Edit,
  EditButton,
  List,
  NumberField,
  NumberInput,
  SelectField,
  SelectInput,
  Show,
  ShowButton,
  SimpleForm,
  SimpleShowLayout,
  TextField,
  TextInput,
  TopToolbar,
  CreateButton,
  ExportButton,
  DateTimeInput,
  UrlField,
} from "react-admin";

const statusChoices = [
  { id: "ACTIVE", name: "Active" },
  { id: "SUSPENDED", name: "Suspendue" },
  { id: "EXPIRED", name: "Expiree" },
];

const licenseFilters = [
  <TextInput key="q" source="q" label="Recherche" alwaysOn />,
  <SelectInput
    key="status"
    source="status"
    label="Statut"
    choices={statusChoices}
  />,
];

const LicenseListActions = () => (
  <TopToolbar>
    <CreateButton />
    <ExportButton />
  </TopToolbar>
);

export const LicenseList = () => (
  <List
    actions={<LicenseListActions />}
    filters={licenseFilters}
    perPage={10}
    sort={{ field: "createdAt", order: "DESC" }}
  >
    <Datagrid rowClick="show" bulkActionButtons={false}>
      <TextField source="clientName" label="Client" />
      <TextField source="serialNumber" label="Numero de serie" />
      <SelectField source="status" label="Statut" choices={statusChoices} />
      <NumberField source="maxUsers" label="Max utilisateurs" />
      <DateField source="expiresAt" label="Expire le" showTime />
      <ShowButton />
      <EditButton />
      <DeleteButton mutationMode="pessimistic" />
    </Datagrid>
  </List>
);

export const LicenseShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="clientName" label="Client" />
      <TextField source="serialNumber" label="Numero de serie" />
      <SelectField source="status" label="Statut" choices={statusChoices} />
      <TextField source="email" label="Email" />
      <TextField source="phone" label="Telephone" />
      <UrlField source="logoUrl" label="Logo" />
      <NumberField source="maxUsers" label="Max utilisateurs" />
      <DateField source="expiresAt" label="Expire le" showTime />
      <DateField source="createdAt" label="Cree le" showTime />
      <DateField source="updatedAt" label="Mis a jour le" showTime />
    </SimpleShowLayout>
  </Show>
);

export const LicenseCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="clientName" label="Client" fullWidth />
      <TextInput source="serialNumber" label="Numero de serie" fullWidth />
      <SelectInput
        source="status"
        label="Statut"
        choices={statusChoices}
        defaultValue="ACTIVE"
        fullWidth
      />
      <TextInput source="email" label="Email de contact" fullWidth />
      <TextInput source="phone" label="Telephone" fullWidth />
      <TextInput source="logoUrl" label="URL du logo" fullWidth />
      <NumberInput source="maxUsers" label="Max utilisateurs" fullWidth />
      <DateTimeInput source="expiresAt" label="Expiration" fullWidth />
    </SimpleForm>
  </Create>
);

export const LicenseEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" disabled fullWidth />
      <TextInput source="clientName" label="Client" fullWidth />
      <TextInput source="serialNumber" label="Numero de serie" fullWidth />
      <SelectInput source="status" label="Statut" choices={statusChoices} fullWidth />
      <TextInput source="email" label="Email de contact" fullWidth />
      <TextInput source="phone" label="Telephone" fullWidth />
      <TextInput source="logoUrl" label="URL du logo" fullWidth />
      <NumberInput source="maxUsers" label="Max utilisateurs" fullWidth />
      <DateTimeInput source="expiresAt" label="Expiration" fullWidth />
    </SimpleForm>
  </Edit>
);
