import type { DataProvider, GetListResult, RaRecord } from "react-admin";

import { getStoredAuth } from "./authProvider";

const API_URL =
  process.env.REACT_APP_API_URL?.replace(/\/+$/, "") ?? "http://localhost:3001";

type ResourceName = "users" | "license";

const resourceConfig: Record<
  ResourceName,
  {
    path: string;
    listKey: string;
    itemKey: string;
  }
> = {
  users: {
    path: "users",
    listKey: "users",
    itemKey: "user",
  },
  license: {
    path: "license",
    listKey: "licenses",
    itemKey: "license",
  },
};

function ensureResource(resource: string): asserts resource is ResourceName {
  if (!(resource in resourceConfig)) {
    throw new Error(`Ressource non supportee: ${resource}`);
  }
}

async function parseJson(response: Response) {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

async function http<T>(resource: ResourceName, init?: RequestInit): Promise<T> {
  const auth = getStoredAuth();
  const response = await fetch(`${API_URL}/${resourceConfig[resource].path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const error = new Error(
      data?.error ??
        data?.message ??
        data?.details?.formErrors?.join(", ") ??
        "Erreur API",
    ) as Error & {
      status?: number;
      body?: unknown;
    };
    error.status = response.status;
    error.body = data;
    throw error;
  }

  return data as T;
}

async function httpById<T>(
  resource: ResourceName,
  id: string | number,
  init?: RequestInit,
): Promise<T> {
  const auth = getStoredAuth();
  const response = await fetch(
    `${API_URL}/${resourceConfig[resource].path}/${encodeURIComponent(String(id))}`,
    {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
        ...(init?.headers ?? {}),
      },
    },
  );

  const data = await parseJson(response);

  if (!response.ok) {
    const error = new Error(
      data?.error ??
        data?.message ??
        data?.details?.formErrors?.join(", ") ??
        "Erreur API",
    ) as Error & {
      status?: number;
      body?: unknown;
    };
    error.status = response.status;
    error.body = data;
    throw error;
  }

  return data as T;
}

function normalizeLicensePayload(data: any) {
  const maxUsers =
    data.maxUsers === null || data.maxUsers === undefined || data.maxUsers === ""
      ? undefined
      : Number(data.maxUsers);

  const expiresAt = data.expiresAt
    ? new Date(data.expiresAt).toISOString()
    : null;

  return {
    clientName: data.clientName,
    serialNumber: data.serialNumber,
    email: data.email || undefined,
    phone: data.phone || undefined,
    logoUrl: data.logoUrl || undefined,
    status: data.status || "ACTIVE",
    maxUsers: Number.isFinite(maxUsers) ? maxUsers : undefined,
    expiresAt,
  };
}

async function getListInternal(resource: ResourceName): Promise<GetListResult> {
  const data = await http<Record<string, RaRecord[]>>(resource);
  const records = data[resourceConfig[resource].listKey] ?? [];

  return {
    data: records,
    total: records.length,
  };
}

function applyListParams<T extends RaRecord>(
  records: T[],
  params: {
    pagination?: { page: number; perPage: number };
    sort?: { field: string; order: "ASC" | "DESC" };
    filter?: Record<string, unknown>;
  },
) {
  let result = [...records];

  const q = typeof params.filter?.q === "string" ? params.filter.q.toLowerCase() : "";
  if (q) {
    result = result.filter((record) =>
      Object.values(record).some((value) =>
        typeof value === "string" ? value.toLowerCase().includes(q) : false,
      ),
    );
  }

  Object.entries(params.filter ?? {}).forEach(([key, value]) => {
    if (key === "q" || value === undefined || value === null || value === "") {
      return;
    }

    result = result.filter((record) => record[key] === value);
  });

  if (params.sort?.field) {
    const { field, order } = params.sort;
    result.sort((a, b) => {
      const left = a[field];
      const right = b[field];

      if (left === right) return 0;
      if (left === undefined || left === null) return order === "ASC" ? -1 : 1;
      if (right === undefined || right === null) return order === "ASC" ? 1 : -1;

      return String(left).localeCompare(String(right), "fr", {
        numeric: true,
        sensitivity: "base",
      }) * (order === "ASC" ? 1 : -1);
    });
  }

  const total = result.length;

  if (params.pagination) {
    const { page, perPage } = params.pagination;
    const start = (page - 1) * perPage;
    result = result.slice(start, start + perPage);
  }

  return { data: result, total };
}

export const dataProvider = {
  getList: async (resource, params) => {
    ensureResource(resource);
    const result = await getListInternal(resource);
    return applyListParams(result.data, params);
  },

  getOne: async (resource, params) => {
    ensureResource(resource);

    const list = await getListInternal(resource);
    const record = list.data.find((item) => item.id === params.id);

    if (!record) {
      throw new Error("Enregistrement introuvable");
    }

    return { data: record };
  },

  getMany: async (resource, params) => {
    ensureResource(resource);

    const list = await getListInternal(resource);
    return {
      data: list.data.filter((item) => params.ids.includes(item.id)),
    };
  },

  getManyReference: async (resource, params) => {
    ensureResource(resource);
    const result = await getListInternal(resource);
    return applyListParams(
      result.data.filter((item) => item[params.target] === params.id),
      params,
    );
  },

  create: async (resource, params) => {
    ensureResource(resource);

    const body =
      resource === "license" ? normalizeLicensePayload(params.data) : params.data;

    const data = await http<Record<string, RaRecord>>(resource, {
      method: "POST",
      body: JSON.stringify(body),
    });

    return {
      data: data[resourceConfig[resource].itemKey],
    };
  },

  update: async (resource, params) => {
    ensureResource(resource);

    const body =
      resource === "license" ? normalizeLicensePayload(params.data) : params.data;

    const data = await httpById<Record<string, RaRecord>>(resource, params.id, {
      method: "PUT",
      body: JSON.stringify(body),
    });

    return {
      data: data[resourceConfig[resource].itemKey],
    };
  },

  updateMany: async (resource, params) => {
    ensureResource(resource);

    await Promise.all(
      params.ids.map((id) =>
        httpById(resource, id, {
          method: "PUT",
          body: JSON.stringify(params.data),
        }),
      ),
    );

    return { data: params.ids };
  },

  delete: async (resource, params) => {
    ensureResource(resource);

    await httpById(resource, params.id, {
      method: "DELETE",
    });

    return { data: params.previousData as RaRecord };
  },

  deleteMany: async (resource, params) => {
    ensureResource(resource);

    await Promise.all(
      params.ids.map((id) =>
        httpById(resource, id, {
          method: "DELETE",
        }),
      ),
    );

    return { data: params.ids };
  },
} as DataProvider;
