El sistema de Incentivos de Zambon es un proyecto que busca favorecer el cálculo registro y consulta de los pagos de comisiones y cumplimiento de cuotas por parte de los empleados de los distintos equipos y grupos de la empresa de carácter mensual y por ciclo (4 meses), el objetivo es contruir una arquitectura capaz de contener la información en BD, realizar el CRUD de las ventas de acuerdo a los parámetros especificados más adelante y realizar consultas, reportes y validaciones de la data. El fin último es saber mensualmente o por ciclo cuanto se debe pagar en incentivos a cada empleado.

El cálculo de estos incentivos es lo que implica un reto, ya que hay diversos factores a tener en cuenta:
1. En la empresa hay diversos equipos, cada uno con una distinta proporción de cálculo de incentivos
2. Estos se calculan con base en Componentes de Ventas, que pueden ser medicamentos u order Taking, lo importante es que los componentes sumados deben dar un 100%
3. Supongamos que el equipo A vende el medicamento X, Y y Order Taking, al mes hay una cuota diferente para cada empleado del equipo de venta de cada uno de estos componentes, y un valor real de venta, con ello se calcula un porcentaje de cumplimiento que se contrasta con el valor de la tabla de curva de pagos que me brinda el porcentaje puntual de comisión que se obtiene por ese componente.
4. Los porcentajes de peso de los componentes cambian por ciclo (ciclo =4 meses)
5. Las comisiones sin embargo, cuentan así mismo con 2 componentes:
    5.1. 80%: Componente de Ventas: se calcula con la suma de los totales de los componentes por empleado (ej: medicamentos+order taking), este se paga mensual
    5.2. 20%: Componente de Ejecución: se calcula por cumplimiento de ciertos KPI's, como un booleano, Si cumple, no cumple, este se paga por ciclo, y si se cumple se multiplica el valor por los 4 meses del ciclo.
6. Cada empleado sin importar su equipo posee un salario base sobre el cual se saca el 80% y el 20% teóricos que deberían ser, con base en esos es que se calculan los cumplimientos de cada punto.
7. Equipos de la empresa:
    7.1. Trade Market:
        A. Cadena
        B. Independientes
        C. Coordinador Trade Market
    7.2. Xadago
    7.3. Representantes Mixtos
    7.4. KAMS
    7.5. Gerente de Distrito
    7.6. Director Comercial
    7.7. Director de Sell Out
8. Estos equipos manejan algunas excepciones del calculo normal
    8.1. Para coordinadores la cuota se calcula con la suma de las cuotas de su equipo
    8.2. Hay 3 equipos a los que el componente del 20% se les paga mensual y NO por ciclo (en este caso no se multiplicaría por 4): KAMS, Dir. Comercial y Dir. Sell Out
    8.3. El 80% y el 20% van a manejar una excepción de pago garantizado cuando el empleado lleve menos de dos meses en la compañía o cuando tenga cambio de zona (sede, ciudad), esos dos primeros meses se le va a pagar completo sin importar su cumplimiento.
9. El equipo de nómina debe poder ver en el sistema el calculo del 80%, del 20% de cada empleado por periodo (mes o ciclo), con su cedula, nombre, fuerza (equipo) y el total de las comisiones
10. Cada empleado debe poder tener un usuario generado con base en su nombre o cedula, y debe poder ingresar al sistema y descargar el reporte de su:
    10.1. 80%: por componente (medicamento u order taking etc), cumplimiento, % de la curva de pagos y el total
    10.2. 20%: se cumple o no se cumple, este componente NO paga sobrecumplimiento (>100%)
11. Como se puede ver, hay muchos parámetros que cambian y varían, así que deben existir las interfaces Admin que permitan cambiar los parámetros del ciclo o del mes e ir almacenando históricos de cómo varían por periodo.
12. La meta es buscar el dinamismo de busqueda de pagos por periodos, por componente (medicamento, etc), por equipo
13. Así mismo hay que establecer con mucha minuciosidad las jerarquías de usuarios, ya que cada equipo tiene su coordinador, y luego hay gerentes, y directores, y estos pueden entrar a ver reportes de sus subordinados, pero el subordinado solo puede ver lo de el, el Admin puede ver todo.
14. El diseño de la base de datos debe ser relacional y sólido para el manejo de toda la información asociada y su correcta asociación con el Backend.
15. Las interfaces actuales son una guía visual de la identidad del sitio y la empresa, pero van a ser modificadas durante el desarrollo con aquellos componentes pertinentes.
16. La idea del sistema es que la persona que vaya a usarlo suba el archivo con las ventas de cada empleado por componente, de acuerdo al periodo y el sistema realice automáticamente el cálculo y registro.
17. Anexo al directorio del proyecto, se encuentra el archivo calculocomisiones.xlsx en donde se puede evidenciar con mayor profundidad el ejemplo del cálculo de los incentivos en un periodo específico, puedes verlo y analizarlo minuciosamente, para identificar entidades y potenciales tablas del modelo relacional.