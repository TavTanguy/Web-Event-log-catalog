<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import Plotly, { Mapbox } from "plotly.js";

const URL = ref("http://91.107.192.39");
//const URL = ref("http://events-logs.loca.lt");
const isSorted = ref(false);

// threshold function
function getListWithoutPercentiles(
  list: number[],
  threshold95: number,
  threshold5: number
): number[] {
  const sortedList = list.sort((a, b) => a - b);

  const ninetyFifthPercentileIndex = Math.floor(sortedList.length * 0.95);

  const fifthPercentileIndex = Math.floor(sortedList.length * 0.05);

  threshold95 = sortedList[ninetyFifthPercentileIndex];

  threshold5 = sortedList[fifthPercentileIndex];

  return list.filter((value) => value > threshold5 && value < threshold95);
}

let list95Value: number;
let list5Value: number;

//datasets

const items = ref([]);
const itemsPerPage = ref("10");
const totalItems = ref("79");
const searchName = ref("");
const searchColl = ref("");
const loading = ref(false);
const headers = ref([
  { title: "id", key: "id" },
  { title: "Collection", key: "collectionName" },
  { title: "Dataset name", key: "name" },

  { title: "URL", key: "link_global" },
  { title: "Author", key: "author" },

  { title: "Action", key: "action", sortable: false },
]);

// dataset infos
const datasetinfos = ref([] as any[]);
const headers4 = ref([
  { title: "Start of activities", key: "start_activities" },
  { title: "End of activities", key: "end_activities" },
  { title: "Number of traces", key: "trace_count" },
  { title: "Trace length mean", key: "trace_length_mean" },
  { title: "Trace length min", key: "trace_length_min" },
  { title: "Trace length max", key: "trace_length_max" },
  { title: "Trace length standard deviation", key: "trace_length_std" },
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
const maxCardinalit = ref("100");

const headers2 = ref([
  { title: "Type", key: "type" },
  { title: "Value type", key: "value_type" },
  { title: "Attribute name", key: "name" },
  { title: "Cardinality", key: "cardinality" },
  { title: "Details", key: "details", sortable: false },
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
const currentValuetype = ref("")

const headers3 = ref([
  { title: "Value", key: "value" },
  { title: "Occurences", key: "occur" },
]);



// function to update datasets
let lastParams: any;
function updateFilter() {
  return updateData(lastParams);
}
let OldMaxCard:string=maxCardinalit.value;

async function updateData({ page, sortBy }) {
  lastParams = { page, sortBy };
  loading.value = true;
  if (sortBy.length == 0) sortBy = [{ key: "", order: "ASC" }];

  const res = await fetch(
    `${URL.value}/v1/dataset?` +
      new URLSearchParams({
        limit: itemsPerPage.value,
        from: ((page - 1) * Number(itemsPerPage.value) + 1).toString(),
        searchCollName: searchColl.value,
        searchName: searchName.value,
        searchNameAttribute: searchAtt.value,
        minCardinality: minCardinality.value,
        maxCardinality: maxCardinalit.value,
        sortBy: sortBy[0].key,
        orderBy: sortBy[0].order.toUpperCase(),
        
      })
  );
  const resJson = await res.json();
  items.value = resJson.res.datasets;
  totalItems.value = resJson.res.totalLength;

if (maxCardinalit.value==OldMaxCard && resJson.res.maxCardinality) {

  maxCardinalit.value = resJson.res.maxCardinality;
}
  loading.value = false;
  isSorted.value = !isSorted.value;
OldMaxCard=maxCardinalit.value
}
// function to fetch dataset infos

async function updateDataInfos() {
  const res = await fetch(
    `${URL.value}/v1/dataset/${currentDatasetId.value}/stats?`
  );
  const resJson = await res.json();
  datasetinfos.value = [resJson.res];
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
    `${URL.value}/v1/dataset/${currentDatasetId.value}/attribute?` +
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
  isSorted.value = !isSorted.value;
}

// function to update values
const box=ref("")
let lastParams3: any;
function updateFilterValue() {
  return updateValue(lastParams3);
}
async function updateValue({ page, sortBy }, limitAll = false) {
  lastParams3 = { page, sortBy };
  loading3.value = true;
  if (sortBy.length == 0) sortBy = [{ key: "", order: "ASC" }];

  const res = await fetch(
    `${URL.value}/v1/dataset/${currentDatasetId.value}/attribute/${currentAttributeId.value}/values?` +
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
  isSorted.value = !isSorted.value;
  if (currentValuetype.value!=="string"){
    box.value="box"
    console.log(box.value)
}
else {
  box.value=""
}
  }
  


// Graph Attributes
const typegraph = ref("bar");
async function openGraph() {
  dialogGraph.value = !dialogGraph.value;
  await updateAttribute(lastParams2, true);

  nextTick(() => {
    const labels = items2.value.map((item: any) => item.name);
    const cards = items2.value.map((item: any) => item.cardinality);
    const sumCard = cards.reduce((acc, val) => acc + val);
    const values = cards.map((card) => (100 * card) / sumCard);
    if (typegraph.value == "bar") {
      Plotly.newPlot("gd", [{ type: typegraph.value, x: labels, y: values }]);
    } else if (typegraph.value == "box") {
      const values = cards.map((card) => card);
      const boxvalues: any[] = [];
      for (let i = 0; i < labels.length; i++) {
        for (let j = 0; j < values[i]; j++) {
          boxvalues.push(labels[i]);
        }
      }

      Plotly.newPlot("gd", [{ y: boxvalues, type: "box" }]);
    } else if (typegraph.value == "markers") {
      const values = cards.map((card) => card);
      Plotly.newPlot("gd", [{ mode: typegraph.value, x: labels, y: values }]);
    } else {
      Plotly.newPlot("gd", [{ type: "pie", labels, values }]);
    }
  });
}

// Graph Values

async function openGraph2() {
  dialogGraph2.value = !dialogGraph2.value;
  await updateValue(lastParams3, true);

  nextTick(() => {
    const labels = items3.value.map((item: any) => item.value);
    const cards = items3.value.map((item: any) => item.occur);
    const sumCard = cards.reduce((acc, val) => acc + val);
    const values = cards.map((card) => (100 * card) / sumCard);

    if (typegraph.value == "bar") {
      const values = cards.map((card) => card);
      Plotly.newPlot("gd", [{ type: typegraph.value, x: labels, y: values }]);
    } else if (typegraph.value == "box") {
      const values = cards.map((card) => card);
      let boxvalues: any[] = [];
      for (let i = 0; i < labels.length; i++) {
        for (let j = 0; j < values[i]; j++) {
          boxvalues.push(labels[i]);
        }
      }

      if (boxvalues.map(Number).every((v) => !Number.isNaN(v))) {
        boxvalues = getListWithoutPercentiles(
          boxvalues,
          list95Value,
          list5Value
        );
      }
      Plotly.newPlot("gd", [{ y: boxvalues, type: "box" }]);
    } else if (typegraph.value == "markers") {
      const values = cards.map((card) => card);
      Plotly.newPlot("gd", [{ mode: typegraph.value, x: labels, y: values }]);
    } else {
      const values = cards.map((card) => (100 * card) / sumCard);
      Plotly.newPlot("gd", [{ type: "pie", labels, values }]);
    }
  });
}

// Dialogue 1 Attribute
function openDialog(datasetId: number, nameDataset: string) {
  dialog.value = !dialog.value;
  items2.value = [];
  currentDatasetId.value = datasetId;
  currentDataset.value = nameDataset;
}

// Dialogue 2 Values
function openDialog2(attributeId: number, nameAttribute: string, Valuetype: string) {
  dialog2.value = !dialog2.value;
  items3.value = [];
  currentAttributeId.value = attributeId;
  currentAttribute.value = nameAttribute;
  currentValuetype.value = Valuetype;
}
// Dialogue 3 Dataset infos
const dialog3 = ref(false);
function openDialog3(datasetId: number, nameDataset: string) {
  dialog3.value = !dialog3.value;
  currentDatasetId.value = datasetId;
  currentDataset.value = nameDataset;
}
// Dialogue import
const dialogimport = ref(false);
function openImport() {
  dialogimport.value = !dialogimport.value;
}

// Disconnect

const token = ref(localStorage.getItem("token"));
function Disconnect() {
  token.value = null;
  localStorage.removeItem("token");
}

// Functions to Upload files

const DatasetName = ref("");
const DatasetAuthor = ref("");
const DatasetCollection = ref("");
const Lglobal = ref("");
const filename = ref(undefined as Array<File> | undefined);
const dialogerrorF = ref(false);
const error = ref(false);

function getFileFormat() {
  if (filename.value == undefined) {
    return "";
  }

  const extensions = filename.value[0].name.split(".");

  if (!["xes", "ocel"].includes(extensions[1])) {
    error.value = true;
    dialogerrorF.value = true;
    return "";
  } else {
    error.value = false;
  }

  return extensions[1];
}

function updateChosenformat() {
  chosenformat.value = "." + getFileFormat();
}

const chosenformat = ref("");
const loading4 = ref(false);
const dialogsuccess = ref(false);
const dialogerror = ref(false);
const UploadError = ref("");
async function UploadData() {
  const formData = new FormData();

  if (filename.value == undefined) {
    return;
  }
  formData.append("file", filename.value[0]);
  formData.append("name", DatasetName.value);
  formData.append("author", DatasetAuthor.value);
  formData.append("collectionName", DatasetCollection.value);
  formData.append("linkGlobal", Lglobal.value);

  const options = {
    headers: { Authorization: `Bearer ${token.value}` },
    method: "POST",
    body: formData,
  };

  if (DatasetName.value !== "" && Lglobal.value !== "") {
    loading4.value = true;
    const res = await fetch(`${URL.value}/v1/dataset/`, options);

    const resJson = await res.json();
    if (resJson.type == "success") dialogsuccess.value = true;
    else {
      UploadError.value = resJson.message;
      dialogerror.value = true;
    }
  }
  loading4.value = false;
  updateFilter();
}
</script>

<!---------------------------------------------------------------------------T E M P L A T E--------------------------------------------------------------------------------------->

<template>
  <div>
    <!-- Login, Register and Import -->
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
      <!-- Upload Dialog-->

      <v-dialog
        v-model="dialogimport"
        max-width="90vw"
        transition="dialog-transition"
        ><v-card>
          <v-toolbar>
            <v-toolbar-title><strong>Upload Dataset</strong>  </v-toolbar-title>
            <v-btn icon="mdi-close-box" @click="openImport"></v-btn>
          </v-toolbar>

          <!-- Upload forms -->
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
                v-model="DatasetAuthor"
                label="Dataset Author"
              ></v-text-field>

              <v-text-field
                v-model="DatasetCollection"
                label="Dataset Collection"
              ></v-text-field>

              <v-text-field
                v-model="Lglobal"
                label="Link global"
              ></v-text-field>

              <v-btn
                @click="UploadData"
                :loading="loading4"
                class="mt-2"
                type="submit"
                block
                >Upload</v-btn
              >
            </v-form>
          </v-sheet>
        </v-card>
      </v-dialog>
    </v-container>

    <!-- Message Upload Success/Error -->

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
          {{ UploadError }}
          <v-icon color="red" icon="mdi-alert-circle" size="small"></v-icon>
        </v-card-title>
      </v-card>
    </v-dialog>

    <!-- MAIN PAGE -->
    <v-card style="text-align: center; font-family: Helvetica">
      <v-card-title primary-title><strong>LOG ATLAS</strong></v-card-title>
    </v-card>

    <!--Search sections-->

    <div class="d-flex">
      <v-autocomplete
        v-model="searchColl"
        @update:modelValue="updateFilter"
        class="ma-0"
        density="compact"
        label="Search collection..."
        hide-details
      >
      </v-autocomplete>

      <v-autocomplete
        v-model="searchName"
        @update:modelValue="updateFilter"
        class="ma-0"
        density="compact"
        label="Search name..."
        hide-details
      >
      </v-autocomplete>
      <v-autocomplete
        v-model="searchAtt"
        @update:modelValue="updateFilter"
        class="ma-0"
        density="compact"
        label="Search attribute..."
        hide-details
      >
      </v-autocomplete>

      <v-text-field
        type="number"
        min="0"
        step="1"
        :max="maxCardinalit"
        v-model="minCardinality"
        @update:modelValue="updateFilter"
        class="ma-0"
        density="compact"
        label="Min. Cardinality"
        hide-details
      >
      </v-text-field>
      <v-text-field
        type="number"
        :min="minCardinality"
        max="251734"
        step="1"
        v-model="maxCardinalit"
        @update:modelValue="updateFilter"
        class="ma-0"
        density="compact"
        label="Max. Cardinality"
        hide-details
      >
      </v-text-field>
    </div>

    <!--Dataset Table-->

    <v-data-table-server
      :items="items"
      :items-length="totalItems"
      :loading="loading"
      :headers="headers"
      v-model:items-per-page="itemsPerPage"
      @update:options="updateData"
    >
      <template v-slot:header.name="{ column }">
        <div class="d-flex align-center">
          <v-tooltip location="top">
            <template v-slot:activator="{ props }">
              <v-btn icon v-bind="props" density="compact">
                <v-icon color="primary"> mdi-information-outline </v-icon>
              </v-btn>
            </template>
            <span>Dataset name can be sorted by clicking on 'name'</span>
          </v-tooltip>
          <v-icon v-if="column.value && isSorted">mdi-arrow-up</v-icon>

          <v-icon v-else-if="column.value && !isSorted">mdi-arrow-down</v-icon>

          {{ column.title }}
        </div>
      </template>

      <!--Buttons to toggle Dataset infos or attributes-->

      <template v-slot:item.action="{ item }">
        <v-btn icon @click="openDialog(item.id, item.name)">...</v-btn>
        <v-btn
          icon="mdi-information"
          @click="openDialog3(item.id, item.name)"
        ></v-btn>
      </template>
    </v-data-table-server>

    <!-- dialog for dataset infos -->

    <v-dialog v-model="dialog3" max-width="90vw" transition="dialog-transition"
      ><v-card>
        <v-toolbar>
          <v-toolbar-title> <strong>Dataset infos</strong> </v-toolbar-title>
          <v-btn icon="mdi-close-box" @click="openDialog3"></v-btn>
        </v-toolbar>
        <v-data-table-virtual
          :items="datasetinfos"
          :loading="loading4"
          :headers="headers4"
          @update:options="updateDataInfos"
        >
        </v-data-table-virtual>
      </v-card>
    </v-dialog>

    <!-- Dialog for Attributes -->
    <v-dialog v-model="dialog" max-width="90vw" transition="dialog-transition"
      ><v-card>
        <v-toolbar>
          <v-toolbar-title> <strong>Dataset : {{ currentDataset }}</strong> </v-toolbar-title>
          <v-btn icon="mdi-close-box" @click="openDialog"></v-btn>
        </v-toolbar>
        <v-card-text>
          <div class="d-flex">
            <!--Search sections-->

            <v-autocomplete
              v-model="searchAtt"
              @update:modelValue="updateFilterAtt"
              class="ma-0"
              density="compact"
              label="Search type..."
              hide-details
            ></v-autocomplete>
            <v-autocomplete
              v-model="searchConcept"
              @update:modelValue="updateFilterAtt"
              class="ma-0"
              density="compact"
              label="Search name..."
              hide-details
            ></v-autocomplete>

            <!-- Graph options and button-->

            <v-btn
              icon="mdi-chart-box"
              variant="outlined"
              :rounded="false"
              color="primary"
              @click="openGraph"
            ></v-btn>
            <v-select
              v-model="typegraph"
              label="Select graph type"
              :items="['pie', 'bar', 'markers']"
              variant="outlined"
            ></v-select>
          </div>

          <!--Attributes table-->

          <v-data-table-server
            :items="items2"
            :items-length="totalItems2"
            :search="searchAtt"
            :loading="loading2"
            :headers="headers2"
            v-model:items-per-page="itemsPerPage2"
            @update:options="updateAttribute"
          >
            <!-- Added filter arrow button and info tool tip-->

            <template v-slot:header.name="{ column }">
              <v-tooltip location="top">
                <template v-slot:activator="{ props }">
                  <v-btn icon v-bind="props" density="compact">
                    <v-icon color="primary"> mdi-information-outline </v-icon>
                  </v-btn>
                </template>
                <span
                  >Attributes names can be sorted by clicking on 'name'</span
                >
              </v-tooltip>
              <v-icon v-if="column.value && isSorted">mdi-arrow-up</v-icon>

              <v-icon v-else-if="column.value && !isSorted"
                >mdi-arrow-down</v-icon
              >
              {{ column.title }}
            </template>

            <template v-slot:header.cardinality="{ column }">
              <v-tooltip location="top">
                <template v-slot:activator="{ props }">
                  <v-btn icon v-bind="props" density="compact">
                    <v-icon color="primary"> mdi-information-outline </v-icon>
                  </v-btn>
                </template>
                <span>Cardinality refers to the amount of this attribute </span>
              </v-tooltip>
              <v-icon v-if="column.value && isSorted">mdi-arrow-up</v-icon>

              <v-icon v-else-if="column.value && !isSorted"
                >mdi-arrow-down</v-icon
              >
              {{ column.title }}
            </template>

            <!--Dialog for Values-->

            <template v-slot:item.details="{ item }">
              <v-btn icon @click="openDialog2(item.id, item.name, item.value_type)">...</v-btn>
            </template>
          </v-data-table-server>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialog2" max-width="90vw" transition="dialog-transition"
      ><v-card>
        <v-toolbar>
          
          <v-toolbar-title  >
            
            <strong>Attribute : {{ currentAttribute }}</strong>
          </v-toolbar-title>
          
          <v-btn icon="mdi-close-box" @click="openDialog2"></v-btn>
        </v-toolbar>

        <!--Search sections-->

        <v-card-text>
          <div class="d-flex">
            <v-autocomplete
              v-model="searchVal"
              @update:modelValue="updateFilterValue"
              class="ma-0"
              density="compact"
              label="Search value..."
              hide-details
            ></v-autocomplete>

            <!--Graph options and button-->

            <v-btn
              icon="mdi-chart-box"
              variant="outlined"
              :rounded="false"
              color="primary"
              @click="openGraph2"
            ></v-btn>
            <v-select
              v-model="typegraph"
              label="Select graph type" 
              :items="['pie', 'bar', 'markers', box]"
              variant="outlined"
            ></v-select>
          </div>

          <!--Values table-->

          <v-data-table-server
            :items="items3"
            :items-length="totalItems3"
            :search="searchVal"
            :loading="loading3"
            :headers="headers3"
            v-model:items-per-page="itemsPerPage3"
            @update:options="updateValue"
          >
            <!-- Added filter arrow button and info tool tip-->
            <template v-slot:header.value="{ column }">
              <v-tooltip location="top">
                <template v-slot:activator="{ props }">
                  <v-btn icon v-bind="props" density="compact">
                    <v-icon color="primary"> mdi-information-outline </v-icon>
                  </v-btn>
                </template>
                <span>Value refers to the attribute value</span>
              </v-tooltip>
              <v-icon v-if="column.value && isSorted">mdi-arrow-up</v-icon>

              <v-icon v-else-if="column.value && !isSorted"
                >mdi-arrow-down</v-icon
              >
              {{ column.title }}
            </template>

            <template v-slot:header.occur="{ column }">
              <v-tooltip location="top">
                <template v-slot:activator="{ props }">
                  <v-btn icon v-bind="props" density="compact">
                    <v-icon color="primary"> mdi-information-outline </v-icon>
                  </v-btn>
                </template>
                <span
                  >Occurencies refers to the existing amount of this value</span
                >
              </v-tooltip>
              <v-icon v-if="column.value && isSorted">mdi-arrow-up</v-icon>

              <v-icon v-else-if="column.value && !isSorted"
                >mdi-arrow-down</v-icon
              >
              {{ column.title }}
            </template>
          </v-data-table-server>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!--Dialog Graph for Attributes-->

    <v-dialog
      v-model="dialogGraph"
      max-width="90vw"
      transition="dialog-transition"
      ><v-card>
        <v-toolbar>
          <v-toolbar-title><strong>{{ currentDataset }}</strong> </v-toolbar-title>
          <v-tooltip v-if="typegraph == 'pie'">
            <template v-slot:activator="{ props }">
              <v-btn icon v-bind="props" density="compact">
                <v-icon color="primary"> mdi-information-outline </v-icon>
              </v-btn>
            </template>
            <span
              >Double clicking on an attribute name hide others. If repeated
              after, goes back to normal.</span
            >
          </v-tooltip>
          <v-btn icon="mdi-close-box" @click="openGraph"></v-btn>
        </v-toolbar>

        <v-card-text>
          <div id="gd"></div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!--Dialog Graph for Values-->

    <v-dialog
      v-model="dialogGraph2"
      max-width="90vw"
      transition="dialog-transition"
      ><v-card>
        <v-toolbar>
          <v-toolbar-title><strong>{{ currentAttribute }} </strong></v-toolbar-title>
          <v-tooltip v-if="typegraph == 'pie'">
            <template v-slot:activator="{ props }">
              <v-btn icon v-bind="props" density="compact">
                <v-icon color="primary"> mdi-information-outline </v-icon>
              </v-btn>
            </template>
            <span
              >Double clicking on a value name hide others. If repeated after,
              goes back to normal.</span
            >
          </v-tooltip>
          <v-btn icon="mdi-close-box" @click="openGraph2"></v-btn>
        </v-toolbar>
        <v-card-text>
          <div id="gd"></div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>
