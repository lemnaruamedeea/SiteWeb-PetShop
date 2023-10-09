window.onload= function(){
    document.getElementById("jucarii_sterse").innerHTML=localStorage.getItem("nume_jucarii")
    document.getElementById("ascuns").value=localStorage.getItem("nume_jucarii");

    document.getElementById("sorteaza").onclick=sorteaza;
    function sorteaza(){
        semn=parseInt(document.getElementById("ordine_sortare").value)
        let extraterestri= Array.from(document.getElementsByClassName("extraterestru"));
        extraterestri.sort(function(a,b){
            let varsta_a=parseInt(a.getElementsByClassName("val-varsta")[0].innerHTML);
            let varsta_b=parseInt(b.getElementsByClassName("val-varsta")[0].innerHTML);
            return semn*(varsta_a-varsta_b);
        });
        for (let extraterestru of extraterestri){
            extraterestru.parentElement.appendChild(extraterestru)
        }
    }

    document.getElementById("filtrare").onclick=filtrare;

    function filtrare(){
        
        let extraterestri= document.getElementsByClassName("extraterestru");
        console.log(122)
        for (let extraterestru of extraterestri){
            extraterestru.style.display="none";
            if (extraterestru.getElementsByClassName("inp")[0].checked){
                extraterestru.style.display="block";
            }
        }
    }

    document.getElementById("filtrare").onclick=filtrare;

    butoane_sterge=document.getElementsByClassName("sterge");
    for(let bt of butoane_sterge){
        bt.onclick=function(){
            this.parentElement.style.display="none";
            let id_jucarie=this.id.substr(1);
            let nume_jucarie=this.name;
            //"jucarii"   "3,10,5"
            let v_iduri= localStorage.getItem("jucarii");
            let v_nume= localStorage.getItem("nume_jucarii");
            if (!v_iduri) 
                {
                    v_iduri=id_jucarie;
                    v_nume=nume_jucarie;
                }
            else{
                v_iduri+=","+id_jucarie
                v_nume+=","+nume_jucarie;
            }
            localStorage.setItem("jucarii",v_iduri);
            localStorage.setItem("nume_jucarii",v_nume);
            document.getElementById("ascuns").value=v_nume;
        }
    }

    document.getElementById("reseteaza_ls").onclick=function(){
        localStorage.clear();
        document.getElementById("jucarii_sterse").innerHTML="";
        filtrare();
        sorteaza();
    }

   
    //////////////////

    

}