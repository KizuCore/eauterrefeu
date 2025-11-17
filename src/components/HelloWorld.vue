

<template>
  <div>
    <h2>Forêt {{ width }} x {{ height }}</h2>
    <div class="table-container">
      <table class="grid-table">
        <tbody>
          <tr v-for="r in rows" :key="r">
            <td
              v-for="c in cols"
              :key="`${r}-${c}`"
              :class="['field', stateClass(cellId(r - 1, c - 1))]"
            ><div class="carre"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'

const width = 10
const height = 10

// 1..N pour v-for
const rows = ref(Array.from({ length: height }, (_, i) => i + 1))
const cols = ref(Array.from({ length: width },  (_, i) => i + 1))

// Ensemble des cellules en feu
const burning = ref(new Map())
const bah = ref(new Set())
const bac = ref(new Set())

const wind = 2

const fieldType = 'tres_sec';

// id stable pour la cellule (0..24)
const cellId = (rIdx: number, cIdx: number) => rIdx * width + cIdx

// entier 0..(n-1)
const rand = (n: number) => Math.floor(Math.random() * n)

const soil = ref<'humide'|'normal'|'sec'|'tres_sec'|null>(null)
const terrain  = ref<'continu'|'peu'|'espace'|'clair'|null>(null) 

let isFinished = false;

function stateClass(id: number) {
  if (burning.value.has(id)) return 'burning' 
  if (bah.value.has(id))     return 'hot'    
  if (bac.value.has(id))     return 'cold'    
  return 'veg'                                 
}

function removeValue<T>(array: T[], value: T): T[] {
  return array.filter(item => item !== value);
}

function getFieldProba(fieldType: string){
  switch(fieldType){
    case 'humide':
      return 0.1;
    case 'normal':
      return 0.3;
    case 'sec':
      return 0.6;
    case 'tres_sec' :
      return 0.9;
  }
}

// tire deux entiers distincts 0..(max-1)
function pickThreeDistinct(max: number) {
  let initialFieldBurningID = rand(max)
  let initialFieldBurningID2 = rand(max)
  let initialFieldBurningID3 = rand(max)
  while (initialFieldBurningID2 === initialFieldBurningID) initialFieldBurningID2 = rand(max)
  while (initialFieldBurningID3 === initialFieldBurningID && initialFieldBurningID3 === initialFieldBurningID2) initialFieldBurningID3 = rand(max)
  return [initialFieldBurningID, initialFieldBurningID2, initialFieldBurningID3]
}

function initGame() {
  const [id1, id2, id3] = pickThreeDistinct(width * height)
  burning.value.set(id1, 2)
  burning.value.set(id2, 2)
  burning.value.set(id3, 2)
}

function play() {
  if (isEndGame()) {
    isFinished = true;
    console.log('🔥 Jeu terminé');
    return;
  }

  setTimeout(() => {
    playTurn();
    play(); // se rappelle lui-même
  }, 100);
}

function playTurn(){
  let currentState: any[] = [];
  //On parcours les bosqués à l'état burn / burn and hot
  const merged = [...burning.value.keys(), ...bah.value];
  for (const fieldBurn of merged) {    
    let fields = getNeighborhood(fieldBurn);
    fields.forEach(field => {
      if(canSendBrandon() && canBeBurned(field)){
        if(tryToBurn()){
          currentState.push(field);
        }
      }
    })
  }
  currentState.forEach(value => {
     burning.value.set(value, 2);
  })
  merged.forEach(fieldBurn => {
    let isBurning = burning.value.has(fieldBurn);
    if(isBurning){
      burning.value.set(fieldBurn, burning.value.get(fieldBurn)-1) 
      if(burning.value.get(fieldBurn) == 0){
        burning.value.delete(fieldBurn)
        bah.value.add(fieldBurn);
      }
    }else{
      if(fireStop()){
        bah.value.delete(fieldBurn);
        bac.value.add(fieldBurn);
      }
    }
  })
}

function fireStop(){
  let proba = 0.6;
  let stat =Math.random();
  return stat <= proba
}

function canSendBrandon(){

  let proba = 0.05 * (1 + wind)
  let stat =Math.random();
  debugger;
  return stat <= proba
}

function isValidField(field: number){
  return field <= height*width && field >= 0
}

function canBeBurned(field: number){
  return (isValidField(field) && !burning.value.has(field) && !bah.value.has(field) && !bac.value.has(field));
}

function tryToBurn(){
  let proba = getFieldProba(fieldType);
  let stat = Math.random();
  if(proba != undefined && stat <= proba){
    return true
  }
  return false
}

function getNeighborhood(fieldBurn: number){
  let fields =[];
  let rightEdge = (fieldBurn+1)%width == 0 ? true : false;
  let leftEdge = fieldBurn%width == 0 || fieldBurn == 0 ? true : false;
  fields = [rightEdge ? fieldBurn : fieldBurn+1, leftEdge ? fieldBurn : fieldBurn-1, fieldBurn+width, fieldBurn-height];
  fields.forEach(field =>{
    if(!isValidField(field)){
      removeValue(fields, field)
    }
  })
  return fields
}

function isEndGame(){
  return burning.value.size == 0 && bah.value.size == 0
}

onMounted(() => {
  initGame()
  play();
})
</script>

