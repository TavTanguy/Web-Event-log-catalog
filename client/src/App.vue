

<script setup lang="ts">
import { ref } from "vue";

//datasets

const items = ref([]);
const itemsPerPage = ref("10");
const totalItems = ref("79");
const search = ref("");
const loading = ref(false);
const headers = ref([
  { title: "id", key: "id" },
  { title: "name", key: "name" },
  { title: "link_local", key: "link_local" },
  { title: "link_local_metadata", key: "link_local_metadata" },
  { title: "link_global", key: "link_global" },
  { title: "action", key: "action", sortable: false },
]);

// attributes

const dialog = ref(false);
const currentDatasetId = ref(1);
const items2 = ref([]);
const itemsPerPage2 = ref("10");
const totalItems2 = ref("79");
const search2 = ref("");
const loading2 = ref(false);

// function to update datasets

async function updateData({ page, sortBy }) {
  loading.value = true;
  if (sortBy.length == 0) sortBy = [{ key: "", order: "ASC" }];

  const res = await fetch(
    "https://nice-cloths-change.loca.lt/v1/dataset?" +
      new URLSearchParams({
        limit: itemsPerPage.value,
        from: ((page - 1) * Number(itemsPerPage.value) + 1).toString(),
        searchName: search.value,
        sortBy: sortBy[0].key,
        orderBy: sortBy[0].order.toUpperCase(),
      })
  );
  const resJson = await res.json();
  items.value = resJson.res.datasets;
  totalItems.value = resJson.res.totalLength;
  loading.value = false;
}

function openDialog(datasetId: number) {
  console.log(datasetId);

  dialog.value = true;
  items2.value = [];
  currentDatasetId.value = datasetId;
}

// function to update attributes

async function updateAttribute({ page, sortBy }) {
  loading2.value = true;
  if (sortBy.length == 0) sortBy = [{ key: "", order: "ASC" }];

  const res = await fetch(
    `https://nice-cloths-change.loca.lt/v1/dataset/${currentDatasetId.value}/attributes?` +
      new URLSearchParams({
        limit: itemsPerPage2.value,
        from: ((page - 1) * Number(itemsPerPage2.value) + 1).toString(),
        searchName: search2.value,
        sortBy: sortBy[0].key,
        orderBy: sortBy[0].order.toUpperCase(),
      })
  );
  const resJson = await res.json();
  items2.value = resJson.res.attributes;
  totalItems2.value = resJson.res.totalLength;
  loading2.value = false;
}
</script>

<template>
  <div>
    <v-data-table-server
      :items="items"
      :items-length="totalItems"
      :search="search"
      :loading="loading"
      :headers="headers"
      v-model:items-per-page="itemsPerPage"
      @update:options="updateData"
    >
      <template v-slot:thead>
        <tr>
          <td></td>
          <td>
            <v-text-field
              v-model="search"
              class="ma-0"
              density="compact"
              placeholder="Search name..."
              hide-details
            ></v-text-field>
          </td>
        </tr>
      </template>
      <template v-slot:item.action="{ item }">
        <v-btn @click="openDialog(item.id)">...</v-btn>
      </template>
    </v-data-table-server>

    <!-- dialog for attributes -->
    <v-dialog v-model="dialog" max-width="800" transition="dialog-transition"
      ><v-card
        ><v-data-table-server
          :items="items2"
          :items-length="totalItems2"
          :search="search2"
          :loading="loading2"
          v-model:items-per-page="itemsPerPage2"
          @update:options="updateAttribute"
        >
          <template v-slot:thead>
            <tr>
              <td>
                <v-text-field
                  v-model="search2"
                  class="ma-0"
                  density="compact"
                  placeholder="Search name..."
                  hide-details
                ></v-text-field>
              </td>
            </tr>
          </template> </v-data-table-server
      ></v-card>
    </v-dialog>
  </div>
</template>