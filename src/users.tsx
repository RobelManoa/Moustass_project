import { List, Datagrid, TextField, EmailField } from "react-admin";

export const UserList = () => (
  <List>
    <Datagrid>
      <TextField source="id" />
      <EmailField source="email" />
      <TextField source="role" />
    </Datagrid>
  </List>
);