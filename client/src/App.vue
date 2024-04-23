

<script setup lang="ts">
import { ref, watch } from 'vue';

//datasets

const items = ref([])
const itemsPerPage = ref ("10")
const totalItems = ref ("79")
const searchName = ref("")
const searchAtt = ref("")
const searchConcept=ref("")
const minCardinality = ref("0")
const maxCardinality = ref("251734")
const loading=ref(false)
const headers=ref([
  {title: "id", key: "id"},
  {title: "name", key: "name"},
  {title: "link_local", key: "link_local"},
  {title: "link_local_metadata", key: "link_local_metadata"},
  {title: "link_global", key: "link_global"},
  {title: "action", key: "action", sortable: false}
  
])

// attributes

const dialog= ref(false)
const currentDatasetId= ref(1)
const items2 = ref([])
const itemsPerPage2 = ref ("10")
const totalItems2 = ref ("79")
const search2 = ref ("")
const loading2=ref(false)

// function to update datasets
let lastParams: any
function updateFilter(){
  return updateData(lastParams)
}
async function updateData({page, sortBy}) {
  lastParams = {page, sortBy}
  loading.value= true
  if(sortBy.length == 0)
    sortBy = [{key: "", order: "ASC"}]
 
  
  const res = await fetch("https://events-logs.loca.lt/v1/dataset?" + new URLSearchParams({
    limit: itemsPerPage.value,
    from: ((page-1)*Number(itemsPerPage.value)+1).toString(), 
    searchName: searchName.value,
    searchNameAttribute: searchAtt.value,
    minCardinality: minCardinality.value,
    maxCardinality: maxCardinality.value,
    sortBy: sortBy[0].key, 
    orderBy: sortBy[0].order.toUpperCase()
  }))
  const resJson = await res.json()
  items.value= resJson.res.datasets
  totalItems.value = resJson.res.totalLength
  loading.value= false

  
}

function openDialog(datasetId: number) {
  
  
  dialog.value = true
  items2.value = []
  currentDatasetId.value = datasetId
}

// function to update attributes
let lastParams2:any
function updateFilterAtt(){
  return updateAttribute(lastParams2)
}

async function updateAttribute({page, sortBy}) {
  lastParams2 = {page, sortBy}
  loading2.value= true
  if(sortBy.length == 0)
    sortBy = [{key: "", order: "ASC"}]
  
  const res = await fetch(`https://events-logs.loca.lt/v1/dataset/${currentDatasetId.value}/attributes?` + new URLSearchParams({
    limit: itemsPerPage2.value,
    from: ((page-1)*Number(itemsPerPage2.value)+1).toString(), 
    searchType: searchAtt.value, 
    searchConcept: searchConcept.value,
    sortBy: sortBy[0].key, 
    orderBy: sortBy[0].order.toUpperCase()
  }))
  const resJson = await res.json()
  items2.value= resJson.res.attributes
  totalItems2.value = resJson.res.totalLength
  loading2.value= false

  
}
</script>

<template>
  
  <div>
    <div class="d-flex">
      <v-text-field v-model="searchName" @update:modelValue="updateFilter" class="ma-0" density="compact" placeholder="Search name..." hide-details>
      </v-text-field>
      <v-text-field v-model="searchAtt" @update:modelValue="updateFilter" class="ma-0" density="compact" placeholder="Search attribute..." hide-details>
      </v-text-field>
      
      <v-text-field type="number"  min="0" step="1" :max="maxCardinality" v-model="minCardinality" @update:modelValue="updateFilter" class="ma-0" density="compact" placeholder="Min. Cardinality" hide-details>
      </v-text-field>
      <v-text-field type="number" :min="minCardinality" max="251734" step="1" v-model="maxCardinality" @update:modelValue="updateFilter" class="ma-0" density="compact" placeholder="Max. Cardinality" hide-details>
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
  
    <template v-slot:item.action="{item}">
    
      <v-btn icon @click="openDialog(item.id)">...</v-btn>
    </template>
  </v-data-table-server>

<!-- dialog for attributes -->
<v-dialog
  v-model="dialog"
  
  max-width="800"
  transition="dialog-transition"
><v-card>
  <div class="d-flex">
  <v-text-field v-model="searchAtt" @update:modelValue="updateFilterAtt" class="ma-0" density="compact" placeholder="Search type..." hide-details></v-text-field>
  <v-text-field v-model="searchConcept" @update:modelValue="updateFilterAtt" class="ma-0" density="compact" placeholder="Search name..." hide-details></v-text-field>
  </div>
  <v-data-table-server
    :items="items2"
    :items-length="totalItems2"
    :search="searchAtt"
    :loading="loading2"
    v-model:items-per-page="itemsPerPage2"
    @update:options="updateAttribute">
  <template v-slot:thead>
    <tr>
      <td>

      </td>
    </tr>
  </template>
  </v-data-table-server></v-card>

</v-dialog>
  </div>
</template>