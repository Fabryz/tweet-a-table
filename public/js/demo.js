(function(){
    
    var $body,
        $demo2,
        $demo3,
        methodMap = { demo2: 'reveal', demo3: 'stairs' };

    function randomAngle(){
        return Math.random() * 60 * (Math.random() > 0.5 ? -1 : 1);
    }

    function init(){
        $body = $(document.body),
        $demo2 = $('.demo2').oriDomi({ hPanels: 1, vPanels: 3 }),
        $demo3 = $('.demo3').oriDomi({ hPanels: 1, vPanels: 5 });
       
        setTimeout(function(){
            $demo2.oriDomi('reveal', 40);
            $demo3.oriDomi('stairs', -25, 'r');
        }, 3000);
        
        $body.on('click', '.source-link', function(){
            var $this = $(this);
            if($this.hasClass('open')){
                $this.removeClass('open').html('&larr; view source')
                    .parent().find('article').addClass('hidden');
            }else{
                $this.addClass('open').html('&larr; hide source')
                    .parent().find('article').removeClass('hidden');
            }
        }).on('click', '.demo', function(){
            var $this = $(this);
            $this.oriDomi(methodMap['demo' + $this.attr('data-id')], randomAngle(), $this.attr('data-anchor'));
        });
    }

    $(init);
})();