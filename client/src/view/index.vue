<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import Plotly from "plotly.js";
import { file } from "@babel/types";

const URL= ref("events-logs.loca.lt")
//datasets

const items = ref([]);
const itemsPerPage = ref("10");
const totalItems = ref("79");
const searchName = ref("");
const loading = ref(false);
const headers = ref([
  { title: "id", key: "id" },
  { title: "name", key: "name" },
  { title: "link_global", key: "link_global" },
  { title: "action", key: "action", sortable: false },
]);

// attributes

const dialog = ref(false);
const currentDatasetId = ref(1);
const currentDataset = ref("");
const searchAtt = ref("");
const items2 = ref([]);
const itemsPerPage2 = ref("10");
const totalItems2 = ref("79");
const search2 = ref("");
const loading2 = ref(false);
const searchConcept = ref("");
const minCardinality = ref("0");
const maxCardinality = ref("251734");

const headers2 = ref([
  { title: "type", key: "type" },
  { title: "name", key: "name" },
  { title: "cardinality", key: "cardinality" },
  { title: "details", key: "details", sortable: false },
]);
const dialogGraph = ref(false);
// values

const dialogGraph2 = ref(false);
const searchVal = ref("");
const loading3 = ref(false);
const items3 = ref([]);
const itemsPerPage3 = ref("10");
const totalItems3 = ref("79");
const dialog2 = ref(false);
const currentAttributeId = ref(1);
const currentAttribute = ref("");

const headers3 = ref([
  { title: "value", key: "value" },
  { title: "occur", key: "occur" },
]);

// function to update datasets
let lastParams: any;
function updateFilter() {
  return updateData(lastParams);
}
async function updateData({ page, sortBy }) {
  lastParams = { page, sortBy };
  loading.value = true;
  if (sortBy.length == 0) sortBy = [{ key: "", order: "ASC" }];

  const res = await fetch(
    `http://${URL.value}/v1/dataset?` +
      new URLSearchParams({
        limit: itemsPerPage.value,
        from: ((page - 1) * Number(itemsPerPage.value) + 1).toString(),
        searchName: searchName.value,
        searchNameAttribute: searchAtt.value,
        minCardinality: minCardinality.value,
        maxCardinality: maxCardinality.value,
        sortBy: sortBy[0].key,
        orderBy: sortBy[0].order.toUpperCase(),
      })
  );
  const resJson = await res.json();
  items.value = resJson.res.datasets;
  totalItems.value = resJson.res.totalLength;
  loading.value = false;
}

// function to update attributes
let lastParams2: any;
function updateFilterAtt() {
  return updateAttribute(lastParams2);
}

async function updateAttribute({ page, sortBy }, limitAll = false) {
  lastParams2 = { page, sortBy };
  loading2.value = true;
  if (sortBy.length == 0) sortBy = [{ key: "", order: "ASC" }];

  const res = await fetch(
    `http://${URL.value}/v1/dataset/${currentDatasetId.value}/attribute?` +
      new URLSearchParams({
        limit: limitAll ? "-1" : itemsPerPage2.value,
        from: ((page - 1) * Number(itemsPerPage2.value) + 1).toString(),
        searchType: searchAtt.value,
        searchConcept: searchConcept.value,
        sortBy: sortBy[0].key,
        orderBy: sortBy[0].order.toUpperCase(),
      })
  );
  const resJson = await res.json();
  items2.value = resJson.res.attributes;
  totalItems2.value = resJson.res.totalLength;
  loading2.value = false;
}

// function to update values
let lastParams3: any;
function updateFilterValue() {
  return updateValue(lastParams3);
}
async function updateValue({ page, sortBy }, limitAll = false) {
  lastParams3 = { page, sortBy };
  loading3.value = true;
  if (sortBy.length == 0) sortBy = [{ key: "", order: "ASC" }];

  const res = await fetch(
    `http://${URL.value}/v1/dataset/${currentDatasetId.value}/attribute/${currentAttributeId.value}/values?` +
      new URLSearchParams({
        limit: limitAll ? "-1" : itemsPerPage3.value,
        from: ((page - 1) * Number(itemsPerPage3.value) + 1).toString(),
        searchVal: searchVal.value,
        sortBy: sortBy[0].key,
        orderBy: sortBy[0].order.toUpperCase(),
      })
  );
  const resJson = await res.json();
  items3.value = resJson.res.values;
  totalItems3.value = resJson.res.totalLength;
  loading3.value = false;
}

// Graph Attributes
async function openGraph() {
  dialogGraph.value = true;
  await updateAttribute(lastParams2, true);

  nextTick(() => {
    const labels = items2.value.map((item: any) => item.name);
    const cards = items2.value.map((item: any) => item.cardinality);
    const sumCard = cards.reduce((acc, val) => acc + val);
    const values = cards.map((card) => (100 * card) / sumCard);
    Plotly.newPlot("gd", [{ type: "pie", labels, values }]);
  });
}

// Graph Values

async function openGraph2() {
  dialogGraph2.value = true;
  await updateValue(lastParams3, true);

  nextTick(() => {
    const labels = items3.value.map((item: any) => item.value);
    const cards = items3.value.map((item: any) => item.occur);
    const sumCard = cards.reduce((acc, val) => acc + val);
    const values = cards.map((card) => (100 * card) / sumCard);
    Plotly.newPlot("gd", [{ type: "pie", labels, values }]);
  });
}

// Dialogue 1
function openDialog(datasetId: number, nameDataset: string) {
  dialog.value = true;
  items2.value = [];
  currentDatasetId.value = datasetId;
  currentDataset.value = nameDataset;
}

// Dialogue 2
function openDialog2(attributeId: number, nameAttribute: string) {
  dialog2.value = true;
  items3.value = [];
  currentAttributeId.value = attributeId;
  currentAttribute.value = nameAttribute;
}

// Dialogue import
const dialogimport = ref(false);
function openImport() {
  dialogimport.value = true;
}

// Disconnect

function Disconnect() {
  token.value = null;
  localStorage.removeItem("token");
}

const token = ref(localStorage.getItem("token"));

const DatasetName = ref("");

const Lglobal = ref("");
const filename = ref(undefined as Array<File> | undefined);

const dialogerrorF= ref(false)
const error= ref(false)

function getFileFormat() {
  if (filename.value == undefined) {
    return "";
  }

  const extensions = filename.value[0].name.split(".");

  if (!["xes", "ocel"].includes(extensions[1])) {
    error.value=true
    dialogerrorF.value = true;
    return "";
  }
  else { error.value=false}

  return extensions[1];
}

function updateChosenformat() {
  chosenformat.value = "." + getFileFormat();
}

const chosenformat = ref("");

const dialogsuccess = ref(false);
const dialogerror =ref (false)
const UploadError = ref ("")
async function UploadData() {
  const formData = new FormData();
  if (filename.value == undefined) {
    return;
  }
  formData.append("file", filename.value[0]);
  formData.append("name", DatasetName.value);
  formData.append("linkGlobal", Lglobal.value);

  const options = {
    headers: { Authorization: `Bearer ${token.value}` },
    method: "POST",
    body: formData,
  };
  
  if ( DatasetName.value!=="" && Lglobal.value!==""){
  const res = await fetch(`http://${URL.value}/v1/dataset/`, options);

  const resJson = await res.json();
  if(resJson.type == "success")
  dialogsuccess.value = true;
  else {
    UploadError.value=resJson.message
    dialogerror.value=true;
  }
  
}

  
}
</script>

<template>
  <div>
    <!-- Login -->
    <v-container>
      <v-btn v-if="!token" density="comfortable"
        ><router-link to="/create">
          <v-icon color="primary" icon="mdi-account" size="large"></v-icon>
          Register</router-link
        ></v-btn
      >
      <v-btn v-if="!token" density="comfortable"
        ><router-link to="/login">
          <v-icon color="primary" icon="mdi-login" size="large"></v-icon>
          Log in</router-link
        ></v-btn
      >
      <v-btn v-else @click="Disconnect" density="comfortable"
        ><router-link to="/">
          <v-icon color="primary" icon="mdi-logout" size="large"></v-icon>
          Log out</router-link
        ></v-btn
      >
      <v-btn v-if="token" @click="openImport()" density="comfortable">
        <v-icon color="primary" icon="mdi-upload" size="large"></v-icon>
        Import</v-btn
      >
      <!-- Upload -->
      <v-dialog
        v-model="dialogimport"
        max-width="90vw"
        transition="dialog-transition"
        ><v-card>
          <v-card-title primary-title>
            {{ "Upload dataset" }}
          </v-card-title>
          <div class="d-flex">
            <v-file-input
              v-model="filename"
              @update:modelValue="updateChosenformat"
              label="File input"
              accept=".xes, .ocel"
              variant="outlined"
            ></v-file-input>

            <v-select
              v-model="chosenformat"
              label="Select format"
              :items="['.xes', '.ocel']"
              variant="outlined"
            ></v-select>
          </div>

          <v-sheet class="mx-auto" width="300">
            <v-form fast-fail @submit.prevent>
              <v-text-field
                v-model="DatasetName"
                label="Dataset Name"
              ></v-text-field>

              <v-text-field
                v-model="Lglobal"
                label="Link global"
              ></v-text-field>

              <v-btn @click="UploadData" class="mt-2" type="submit" block
                >Upload</v-btn
              >
            </v-form>
          </v-sheet>
        </v-card>
      </v-dialog>
    </v-container>

    <v-dialog
      v-model="dialogsuccess"
      max-width="300"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title>
          File Succesfuly Uploaded
          <v-icon color="primary" icon="mdi-check-circle" size="small"></v-icon>
        </v-card-title>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="dialogerrorF"
      max-width="300"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title>
          Wrong format error
          <v-icon color="red" icon="mdi-alert-circle" size="small"></v-icon>
        </v-card-title>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="dialogerror"
      max-width="300"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title>
          {{UploadError}}
          <v-icon color="red" icon="mdi-alert-circle" size="small"></v-icon>
        </v-card-title>
      </v-card>
    </v-dialog>


    <v-card style="text-align: center; font-family: Helvetica">
      <v-card-title primary-title
        ><strong>EVENTLOG EXPLORER</strong></v-card-title
      >
    </v-card>

    <div class="d-flex">
      <v-text-field
        v-model="searchName"
        @update:modelValue="updateFilter"
        class="ma-0"
        density="compact"
        placeholder="Search name..."
        hide-details
      >
      </v-text-field>
      <v-text-field
        v-model="searchAtt"
        @update:modelValue="updateFilter"
        class="ma-0"
        density="compact"
        placeholder="Search attribute..."
        hide-details
      >
      </v-text-field>

      <v-text-field
        type="number"
        min="0"
        step="1"
        :max="maxCardinality"
        v-model="minCardinality"
        @update:modelValue="updateFilter"
        class="ma-0"
        density="compact"
        placeholder="Min. Cardinality"
        hide-details
      >
      </v-text-field>
      <v-text-field
        type="number"
        :min="minCardinality"
        max="251734"
        step="1"
        v-model="maxCardinality"
        @update:modelValue="updateFilter"
        class="ma-0"
        density="compact"
        placeholder="Max. Cardinality"
        hide-details
      >
      </v-text-field>
    </div>

    <v-data-table-server
      :items="items"
      :items-length="totalItems"
      :loading="loading"
      :headers="headers"
      v-model:items-per-page="itemsPerPage"
      @update:options="updateData"
    >
      <template v-slot:item.action="{ item }">
        <v-btn icon @click="openDialog(item.id, item.name)">...</v-btn>
      </template>
    </v-data-table-server>

    <!-- dialog for attributes -->
    <v-dialog v-model="dialog" max-width="90vw" transition="dialog-transition"
      ><v-card>
        <v-card-title primary-title>
          {{ currentDataset }}
        </v-card-title>
        <v-card-text>
          <div class="d-flex">
            <v-text-field
              v-model="searchAtt"
              @update:modelValue="updateFilterAtt"
              class="ma-0"
              density="compact"
              placeholder="Search type..."
              hide-details
            ></v-text-field>
            <v-text-field
              v-model="searchConcept"
              @update:modelValue="updateFilterAtt"
              class="ma-0"
              density="compact"
              placeholder="Search name..."
              hide-details
            ></v-text-field>
            <v-btn
              icon="mdi-chart-box"
              variant="outlined"
              :rounded="false"
              color="primary"
              @click="openGraph"
            ></v-btn>
          </div>
          <v-data-table-server
            :items="items2"
            :items-length="totalItems2"
            :search="searchAtt"
            :loading="loading2"
            :headers="headers2"
            v-model:items-per-page="itemsPerPage2"
            @update:options="updateAttribute"
          >
            <template v-slot:item.details="{ item }">
              <v-btn icon @click="openDialog2(item.id, item.name)">...</v-btn>
            </template>
          </v-data-table-server>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialog2" max-width="90vw" transition="dialog-transition"
      ><v-card>
        <v-card-title primary-title>
          {{ currentAttribute }}
        </v-card-title>
        <v-card-text>
          <div class="d-flex">
            <v-text-field
              v-model="searchVal"
              @update:modelValue="updateFilterValue"
              class="ma-0"
              density="compact"
              placeholder="Search value..."
              hide-details
            ></v-text-field>
            <v-btn
              icon="mdi-chart-box"
              variant="outlined"
              :rounded="false"
              color="primary"
              @click="openGraph2"
            ></v-btn>
          </div>
          <v-data-table-server
            :items="items3"
            :items-length="totalItems3"
            :search="searchVal"
            :loading="loading3"
            :headers="headers3"
            v-model:items-per-page="itemsPerPage3"
            @update:options="updateValue"
          >
          </v-data-table-server>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogGraph"
      max-width="90vw"
      transition="dialog-transition"
      ><v-card>
        <v-card-title primary-title>
          {{ currentDataset }}
        </v-card-title>
        <v-card-text>
          <div id="gd"></div>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogGraph2"
      max-width="90vw"
      transition="dialog-transition"
      ><v-card>
        <v-card-title primary-title>
          {{ currentAttribute }}
        </v-card-title>
        <v-card-text>
          <div id="gd"></div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>
